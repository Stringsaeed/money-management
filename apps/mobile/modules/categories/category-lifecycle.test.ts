import { afterEach, describe, expect, it } from "@jest/globals";
import type { SQLiteDatabase } from "expo-sqlite";

import { migrateBudgeting } from "@/db/budgeting-migration";
import { migrateCategoryLifecycle } from "@/db/category-lifecycle-migration";
import { migrateRecurringRules } from "@/db/recurring-rules-migration";
import { applyLegacyMigrations, createTestSQLiteDatabase } from "@/tests/test-utils/sqlite";

import { archiveCategory, deleteCategory, restoreCategory } from "./category-lifecycle";

const databases: { database: SQLiteDatabase; close: VoidFunction }[] = [];

async function setup(): Promise<SQLiteDatabase> {
  const testDatabase = createTestSQLiteDatabase();
  databases.push(testDatabase);
  await applyLegacyMigrations(testDatabase.database);
  await migrateRecurringRules(testDatabase.database, {
    timeZone: "Asia/Dubai",
    localDate: "2026-08-18",
    now: "2026-08-18T08:00:00.000Z",
  });
  await migrateBudgeting(testDatabase.database);
  await migrateCategoryLifecycle(testDatabase.database);
  return testDatabase.database;
}

afterEach(() => {
  databases.splice(0).forEach(({ close }) => close());
});

describe("Category lifecycle", () => {
  it("archives a used Category without rewriting its Transaction or current-period mapping", async () => {
    const database = await setup();
    await insertMappedCategoryHistory(database);

    await archiveCategory(database, {
      categoryId: "category-dining",
      localDate: "2026-08-18",
      now: "2026-08-18T08:00:00.000Z",
    });

    await expect(
      database.getFirstAsync(
        `SELECT lifecycle, lifecycle_changed_at AS lifecycleChangedAt
         FROM categories WHERE id = ?`,
        "category-dining",
      ),
    ).resolves.toEqual({
      lifecycle: "archived",
      lifecycleChangedAt: "2026-08-18T08:00:00.000Z",
    });
    await expect(
      database.getFirstAsync(
        "SELECT category_id AS categoryId FROM transactions WHERE id = ?",
        "transaction-dining",
      ),
    ).resolves.toEqual({ categoryId: "category-dining" });
    await expect(
      database.getAllAsync(
        `SELECT effective_from_period AS effectiveFromPeriod,
                effective_to_period AS effectiveToPeriod
         FROM category_mappings
         WHERE category_id = ?
         ORDER BY effective_from_period`,
        "category-dining",
      ),
    ).resolves.toEqual([{ effectiveFromPeriod: "2026-07", effectiveToPeriod: "2026-08" }]);
  });

  it("restores selection eligibility without recreating future Category Mappings", async () => {
    const database = await setup();
    await insertMappedCategoryHistory(database);
    await archiveCategory(database, {
      categoryId: "category-dining",
      localDate: "2026-08-18",
      now: "2026-08-18T08:00:00.000Z",
    });

    await restoreCategory(database, {
      categoryId: "category-dining",
      now: "2026-08-19T08:00:00.000Z",
    });

    await expect(
      database.getFirstAsync(
        `SELECT lifecycle, lifecycle_changed_at AS lifecycleChangedAt
         FROM categories WHERE id = ?`,
        "category-dining",
      ),
    ).resolves.toEqual({
      lifecycle: "active",
      lifecycleChangedAt: "2026-08-19T08:00:00.000Z",
    });
    await expect(
      database.getAllAsync(
        `SELECT effective_from_period AS effectiveFromPeriod,
                effective_to_period AS effectiveToPeriod
         FROM category_mappings WHERE category_id = ?`,
        "category-dining",
      ),
    ).resolves.toEqual([{ effectiveFromPeriod: "2026-07", effectiveToPeriod: "2026-08" }]);
  });

  it("requires real lifecycle transitions", async () => {
    const database = await setup();
    await insertMappedCategoryHistory(database);

    await expect(
      restoreCategory(database, {
        categoryId: "category-dining",
        now: "2026-08-18T08:00:00.000Z",
      }),
    ).rejects.toThrow("must be archived");
    await archiveCategory(database, {
      categoryId: "category-dining",
      localDate: "2026-08-18",
      now: "2026-08-18T08:00:00.000Z",
    });
    await expect(
      archiveCategory(database, {
        categoryId: "category-dining",
        localDate: "2026-08-18",
        now: "2026-08-18T08:01:00.000Z",
      }),
    ).rejects.toThrow("must be active");
  });

  it("refuses to permanently delete a Category with ledger history", async () => {
    const database = await setup();
    await insertMappedCategoryHistory(database);

    await expect(deleteCategory(database, "category-dining")).rejects.toThrow(
      "Archive it to preserve its financial history",
    );
    await expect(
      database.getFirstAsync("SELECT id FROM categories WHERE id = ?", "category-dining"),
    ).resolves.toEqual({ id: "category-dining" });
  });

  it("refuses to permanently delete a mapped Category with Assignment history", async () => {
    const database = await setup();
    await insertMappedCategoryHistory(database);
    await database.runAsync("DELETE FROM transactions WHERE id = ?", "transaction-dining");
    await database.runAsync(
      `INSERT INTO assignments (
        id, currency, budget_period, source_envelope_id, destination_envelope_id,
        amount_minor, reverses_assignment_id, created_at
      ) VALUES (
        'assignment-food', 'USD', '2026-08', NULL, 'envelope-food', 5000, NULL, ?
      )`,
      "2026-08-01T00:00:00.000Z",
    );

    await expect(deleteCategory(database, "category-dining")).rejects.toThrow(
      "Archive it to preserve its financial history",
    );
  });

  it("permanently deletes a Category that has no dependent history", async () => {
    const database = await setup();
    const createdAt = "2026-01-01T00:00:00.000Z";
    await database.runAsync(
      `INSERT INTO categories (
        id, name, type, color, icon, parent_id, sort_order, created_at, updated_at
      ) VALUES ('category-unused', 'Unused', 'expense', '#B48A7B', '🏷️', NULL, 0, ?, ?)`,
      createdAt,
      createdAt,
    );

    await deleteCategory(database, "category-unused");

    await expect(
      database.getFirstAsync("SELECT id FROM categories WHERE id = ?", "category-unused"),
    ).resolves.toBeNull();
  });

  it("rolls back the lifecycle when ending future mappings fails", async () => {
    const database = await setup();
    await insertMappedCategoryHistory(database);
    await database.execAsync(`
      CREATE TRIGGER fail_category_mapping_end
      BEFORE UPDATE ON category_mappings
      WHEN OLD.category_id = 'category-dining'
      BEGIN
        SELECT RAISE(ABORT, 'forced mapping failure');
      END;
    `);

    await expect(
      archiveCategory(database, {
        categoryId: "category-dining",
        localDate: "2026-08-18",
        now: "2026-08-18T08:00:00.000Z",
      }),
    ).rejects.toThrow("forced mapping failure");
    await expect(
      database.getFirstAsync(
        "SELECT lifecycle, lifecycle_changed_at AS lifecycleChangedAt FROM categories WHERE id = ?",
        "category-dining",
      ),
    ).resolves.toEqual({ lifecycle: "active", lifecycleChangedAt: null });
  });

  it("uses the archive Ledger Date period at a month boundary", async () => {
    const database = await setup();
    await insertMappedCategoryHistory(database);

    await archiveCategory(database, {
      categoryId: "category-dining",
      localDate: "2026-09-01",
      now: "2026-08-31T20:00:00.000Z",
    });

    await expect(
      database.getAllAsync(
        `SELECT effective_from_period AS effectiveFromPeriod,
                effective_to_period AS effectiveToPeriod
         FROM category_mappings WHERE category_id = ?`,
        "category-dining",
      ),
    ).resolves.toEqual([{ effectiveFromPeriod: "2026-07", effectiveToPeriod: "2026-09" }]);
  });

  it("rejects new activity while allowing historical references to remain unchanged", async () => {
    const database = await setup();
    await insertMappedCategoryHistory(database);
    await archiveCategory(database, {
      categoryId: "category-dining",
      localDate: "2026-08-18",
      now: "2026-08-18T08:00:00.000Z",
    });

    await expect(
      database.runAsync(
        `INSERT INTO transactions (
          id, type, amount, currency, date, account_id, category_id,
          is_recurring, description, created_at, updated_at
        ) VALUES ('transaction-new', 'expense', 500, 'USD', '2026-08-18',
          'account-main', 'category-dining', 0, '', ?, ?)`,
        "2026-08-18T08:00:00.000Z",
        "2026-08-18T08:00:00.000Z",
      ),
    ).rejects.toThrow("Archived Category is unavailable for new activity");
    await expect(
      database.runAsync(
        `INSERT INTO recurring_rules (
          id, name, type, amount_minor, currency, account_id, to_account_id,
          category_id, description, frequency, interval_count, start_date, time_zone,
          lifecycle, health, attention_reasons, eligibility_floor, revision, created_at, updated_at
        ) VALUES ('rule-new', 'Dining', 'expense', 500, 'USD', 'account-main', NULL,
          'category-dining', '', 'month', 1, '2026-09-01', 'Asia/Dubai', 'active', 'ready',
          '[]', '2026-09-01', 1, ?, ?)`,
        "2026-08-18T08:00:00.000Z",
        "2026-08-18T08:00:00.000Z",
      ),
    ).rejects.toThrow("Archived Category is unavailable for new activity");

    await expect(
      database.runAsync(
        "UPDATE transactions SET category_id = ?, description = ? WHERE id = ?",
        "category-dining",
        "Still historical",
        "transaction-dining",
      ),
    ).resolves.toBeDefined();
  });
});

async function insertMappedCategoryHistory(database: SQLiteDatabase): Promise<void> {
  const createdAt = "2026-01-01T00:00:00.000Z";
  await database.runAsync(
    `INSERT INTO accounts (
      id, name, type, currency, color, icon, initial_balance,
      exclude_from_total, sort_order, created_at, updated_at
    ) VALUES ('account-main', 'Main', 'checking', 'USD', '#8B9D83', '🏦', 0, 0, 0, ?, ?)`,
    createdAt,
    createdAt,
  );
  await database.runAsync(
    `INSERT INTO categories (
      id, name, type, color, icon, parent_id, sort_order, created_at, updated_at
    ) VALUES ('category-dining', 'Dining', 'expense', '#B48A7B', '🍽️', NULL, 0, ?, ?)`,
    createdAt,
    createdAt,
  );
  await database.runAsync(
    `INSERT INTO transactions (
      id, type, amount, currency, date, account_id, category_id,
      is_recurring, description, created_at, updated_at
    ) VALUES ('transaction-dining', 'expense', 1200, 'USD', '2026-08-02',
      'account-main', 'category-dining', 0, '', ?, ?)`,
    createdAt,
    createdAt,
  );
  await database.runAsync(
    `INSERT INTO budget_workspaces (currency, activation_period, created_at, updated_at)
     VALUES ('USD', '2026-07', ?, ?)`,
    createdAt,
    createdAt,
  );
  await database.runAsync(
    `INSERT INTO envelopes (
      id, currency, name, icon, color, lifecycle, sort_order, created_at, updated_at
    ) VALUES ('envelope-food', 'USD', 'Food', '🍲', '#B48A7B', 'active', 0, ?, ?)`,
    createdAt,
    createdAt,
  );
  await database.runAsync(
    `INSERT INTO category_mappings (
      category_id, envelope_id, effective_from_period, effective_to_period, created_at
    ) VALUES ('category-dining', 'envelope-food', '2026-07', NULL, ?)`,
    createdAt,
  );
  await database.runAsync(
    `INSERT INTO category_mappings (
      category_id, envelope_id, effective_from_period, effective_to_period, created_at
    ) VALUES ('category-dining', 'envelope-food', '2026-10', NULL, ?)`,
    createdAt,
  );
}

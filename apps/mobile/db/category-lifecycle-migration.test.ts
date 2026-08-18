import { afterEach, describe, expect, it } from "@jest/globals";
import type { SQLiteDatabase } from "expo-sqlite";

import { migrateRecurringRules } from "@/db/recurring-rules-migration";
import { applyLegacyMigrations, createTestSQLiteDatabase } from "@/tests/test-utils/sqlite";

import { migrateCategoryLifecycle } from "./category-lifecycle-migration";

const databases: { database: SQLiteDatabase; close: VoidFunction }[] = [];

afterEach(() => {
  databases.splice(0).forEach(({ close }) => close());
});

describe("migrateCategoryLifecycle", () => {
  it("backfills existing Categories as active and is idempotent", async () => {
    const testDatabase = createTestSQLiteDatabase();
    databases.push(testDatabase);
    const database = testDatabase.database;
    await applyLegacyMigrations(database);
    await migrateRecurringRules(database, migrationContext);
    await database.runAsync(
      `INSERT INTO categories (
        id, name, type, color, icon, parent_id, sort_order, created_at, updated_at
      ) VALUES ('category-existing', 'Existing', 'expense', '#B48A7B', '🏷️', NULL, 0, ?, ?)`,
      "2026-01-01T00:00:00.000Z",
      "2026-01-01T00:00:00.000Z",
    );

    await migrateCategoryLifecycle(database);
    await migrateCategoryLifecycle(database);

    await expect(
      database.getFirstAsync(
        `SELECT lifecycle, lifecycle_changed_at AS lifecycleChangedAt
         FROM categories WHERE id = ?`,
        "category-existing",
      ),
    ).resolves.toEqual({ lifecycle: "active", lifecycleChangedAt: null });
    await expect(
      database.getFirstAsync(
        "SELECT value FROM app_settings WHERE key = ?",
        "categoryLifecycleMigrationVersion",
      ),
    ).resolves.toEqual({ value: "1" });
  });

  it("refuses a current stamp when the lifecycle schema is missing", async () => {
    const testDatabase = createTestSQLiteDatabase();
    databases.push(testDatabase);
    const database = testDatabase.database;
    await applyLegacyMigrations(database);
    await database.runAsync(
      "INSERT INTO app_settings (key, value) VALUES (?, ?)",
      "categoryLifecycleMigrationVersion",
      "1",
    );

    await expect(migrateCategoryLifecycle(database)).rejects.toThrow(
      "Category lifecycle migration is incomplete",
    );
  });

  it("refuses lifecycle columns with unsupported nullability and defaults", async () => {
    const testDatabase = createTestSQLiteDatabase();
    databases.push(testDatabase);
    const database = testDatabase.database;
    await applyLegacyMigrations(database);
    await database.execAsync(`
      ALTER TABLE categories ADD COLUMN lifecycle TEXT;
      ALTER TABLE categories ADD COLUMN lifecycle_changed_at TEXT NOT NULL DEFAULT '';
    `);

    await expect(migrateCategoryLifecycle(database)).rejects.toThrow(
      "does not match the supported structure",
    );
    await expect(
      database.getFirstAsync(
        "SELECT value FROM app_settings WHERE key = ?",
        "categoryLifecycleMigrationVersion",
      ),
    ).resolves.toBeNull();
  });

  it("refuses a current stamp when an activity guard trigger is missing", async () => {
    const testDatabase = createTestSQLiteDatabase();
    databases.push(testDatabase);
    const database = testDatabase.database;
    await applyLegacyMigrations(database);
    await migrateRecurringRules(database, migrationContext);
    await migrateCategoryLifecycle(database);
    await database.execAsync("DROP TRIGGER category_active_transaction_insert");

    await expect(migrateCategoryLifecycle(database)).rejects.toThrow(
      "trigger category_active_transaction_insert does not match",
    );
  });
});

const migrationContext = {
  timeZone: "Asia/Dubai",
  localDate: "2026-08-18",
  now: "2026-08-18T08:00:00.000Z",
};

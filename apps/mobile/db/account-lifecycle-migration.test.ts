import { afterEach, describe, expect, it } from "@jest/globals";
import type { SQLiteDatabase } from "expo-sqlite";

import { migrateBudgeting } from "@/db/budgeting-migration";
import { migrateRecurringRules } from "@/db/recurring-rules-migration";
import { applyLegacyMigrations, createTestSQLiteDatabase } from "@/tests/test-utils/sqlite";

import { migrateAccountLifecycle } from "./account-lifecycle-migration";

const databases: { database: SQLiteDatabase; close: VoidFunction }[] = [];

afterEach(() => {
  databases.splice(0).forEach(({ close }) => close());
});

describe("migrateAccountLifecycle", () => {
  it("backfills existing Accounts as active and is idempotent", async () => {
    const database = await setup();
    await database.runAsync(
      `INSERT INTO accounts (
        id, name, type, currency, color, icon, initial_balance,
        exclude_from_total, sort_order, created_at, updated_at
      ) VALUES ('account-existing', 'Existing', 'checking', 'USD', '#8B9D83', '🏦',
        0, 0, 0, ?, ?)`,
      migrationContext.now,
      migrationContext.now,
    );

    await migrateAccountLifecycle(database);
    await migrateAccountLifecycle(database);

    await expect(
      database.getFirstAsync(
        `SELECT lifecycle, lifecycle_changed_at AS lifecycleChangedAt
         FROM accounts WHERE id = ?`,
        "account-existing",
      ),
    ).resolves.toEqual({ lifecycle: "active", lifecycleChangedAt: null });
    await expect(
      database.getFirstAsync(
        "SELECT value FROM app_settings WHERE key = ?",
        "accountLifecycleMigrationVersion",
      ),
    ).resolves.toEqual({ value: "1" });
  });

  it("refuses a current stamp when the lifecycle schema is missing", async () => {
    const database = await setup();
    await database.runAsync(
      "INSERT INTO app_settings (key, value) VALUES (?, ?)",
      "accountLifecycleMigrationVersion",
      "1",
    );

    await expect(migrateAccountLifecycle(database)).rejects.toThrow(
      "Account lifecycle migration is incomplete",
    );
  });

  it("refuses lifecycle columns with unsupported nullability and defaults", async () => {
    const database = await setup();
    await database.execAsync(`
      ALTER TABLE accounts ADD COLUMN lifecycle TEXT;
      ALTER TABLE accounts ADD COLUMN lifecycle_changed_at TEXT NOT NULL DEFAULT '';
    `);

    await expect(migrateAccountLifecycle(database)).rejects.toThrow(
      "does not match the supported structure",
    );
    await expect(
      database.getFirstAsync(
        "SELECT value FROM app_settings WHERE key = ?",
        "accountLifecycleMigrationVersion",
      ),
    ).resolves.toBeNull();
  });

  it("rolls back lifecycle columns when guard installation fails", async () => {
    const database = await setup();
    await database.execAsync(`
      CREATE TRIGGER active_account_transaction_insert
      BEFORE INSERT ON transactions
      BEGIN
        SELECT 1;
      END;
    `);

    await expect(migrateAccountLifecycle(database)).rejects.toThrow();
    const columns = await database.getAllAsync<{ name: string }>("PRAGMA table_info(accounts)");
    expect(columns.map(({ name }) => name)).not.toContain("lifecycle");
    await expect(
      database.getFirstAsync(
        "SELECT value FROM app_settings WHERE key = ?",
        "accountLifecycleMigrationVersion",
      ),
    ).resolves.toBeNull();
  });
});

async function setup(): Promise<SQLiteDatabase> {
  const testDatabase = createTestSQLiteDatabase();
  databases.push(testDatabase);
  const database = testDatabase.database;
  await applyLegacyMigrations(database);
  await migrateRecurringRules(database, migrationContext);
  await migrateBudgeting(database);
  return database;
}

const migrationContext = {
  timeZone: "Asia/Dubai",
  localDate: "2026-08-18",
  now: "2026-08-18T08:00:00.000Z",
};

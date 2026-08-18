import { afterEach, describe, expect, it } from "@jest/globals";
import type { SQLiteDatabase } from "expo-sqlite";

import {
  applyLegacyMigrations,
  createTestSQLiteDatabase,
  markLegacyMigrationsApplied,
} from "@/tests/test-utils/sqlite";

import { initializeDatabase } from "./initialize";

const databases: { database: SQLiteDatabase; close: VoidFunction }[] = [];

afterEach(() => {
  databases.splice(0).forEach(({ close }) => close());
});

describe("initializeDatabase", () => {
  it("runs the complete fresh startup sequence through the budgeting migration", async () => {
    const testDatabase = createTestSQLiteDatabase();
    databases.push(testDatabase);

    await initializeDatabase(testDatabase.database, {
      migrationInstant: new Date("2026-08-18T08:00:00.000Z"),
      timeZone: "Asia/Dubai",
    });

    await expect(
      testDatabase.database.getFirstAsync(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'recurring_payments'",
      ),
    ).resolves.toBeNull();
    await expect(
      testDatabase.database.getFirstAsync(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'budget_workspaces'",
      ),
    ).resolves.toEqual({ name: "budget_workspaces" });
    await expect(
      testDatabase.database.getAllAsync(
        `SELECT key, value FROM app_settings
         WHERE key IN (
           'resetVersion',
           'recurringRulesMigrationVersion',
           'budgetingMigrationVersion',
           'categoryLifecycleMigrationVersion'
         )
         ORDER BY key`,
      ),
    ).resolves.toEqual([
      { key: "budgetingMigrationVersion", value: "1" },
      { key: "categoryLifecycleMigrationVersion", value: "1" },
      { key: "recurringRulesMigrationVersion", value: "1" },
      { key: "resetVersion", value: "1" },
    ]);
    await expect(
      testDatabase.database.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) AS count FROM categories",
      ),
    ).resolves.toEqual({ count: 11 });
  });

  it("preserves a supported legacy ledger while running the production startup path", async () => {
    const testDatabase = createTestSQLiteDatabase();
    databases.push(testDatabase);
    await applyLegacyMigrations(testDatabase.database);
    await markLegacyMigrationsApplied(testDatabase.database);
    await testDatabase.database.runAsync(
      `INSERT INTO accounts (
        id, name, type, currency, color, icon, initial_balance,
        exclude_from_total, sort_order, created_at, updated_at
      ) VALUES (
        'account-main', 'Main', 'checking', 'USD', '#8B9D83', '🏦', 10000,
        0, 0, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'
      )`,
    );
    await testDatabase.database.runAsync(
      `INSERT INTO transactions (
        id, type, amount, currency, date, account_id, is_recurring,
        description, created_at, updated_at
      ) VALUES (
        'transaction-1', 'expense', 2500, 'USD', '2026-08-05',
        'account-main', 0, 'Groceries',
        '2026-08-05T08:00:00.000Z', '2026-08-05T08:00:00.000Z'
      )`,
    );

    await initializeDatabase(testDatabase.database, {
      migrationInstant: new Date("2026-08-18T08:00:00.000Z"),
      timeZone: "Asia/Dubai",
    });

    await expect(
      testDatabase.database.getFirstAsync(
        `SELECT id, amount, account_id AS accountId
         FROM transactions WHERE id = 'transaction-1'`,
      ),
    ).resolves.toEqual({ id: "transaction-1", amount: 25_00, accountId: "account-main" });
    await expect(
      testDatabase.database.getFirstAsync(
        "SELECT value FROM app_settings WHERE key = 'resetVersion'",
      ),
    ).resolves.toEqual({ value: "1" });
  });
});

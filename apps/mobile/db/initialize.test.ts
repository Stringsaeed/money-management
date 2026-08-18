import { afterEach, describe, expect, it } from "@jest/globals";
import type { SQLiteDatabase } from "expo-sqlite";

import { createTestSQLiteDatabase } from "@/tests/test-utils/sqlite";

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
         WHERE key IN ('resetVersion', 'recurringRulesMigrationVersion', 'budgetingMigrationVersion')
         ORDER BY key`,
      ),
    ).resolves.toEqual([
      { key: "budgetingMigrationVersion", value: "1" },
      { key: "recurringRulesMigrationVersion", value: "1" },
      { key: "resetVersion", value: "1" },
    ]);
    await expect(
      testDatabase.database.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) AS count FROM categories",
      ),
    ).resolves.toEqual({ count: 11 });
  });
});

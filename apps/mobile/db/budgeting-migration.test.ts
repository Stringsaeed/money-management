import { afterEach, describe, expect, it } from "@jest/globals";
import type { SQLiteDatabase } from "expo-sqlite";

import { applyLegacyMigrations, createTestSQLiteDatabase } from "@/tests/test-utils/sqlite";

import { migrateBudgeting } from "./budgeting-migration";
import { CREATE_BUDGETING_SCHEMA_SQL } from "./budgeting-schema";
import { migrateRecurringRules } from "./recurring-rules-migration";

const databases: { database: SQLiteDatabase; close: VoidFunction }[] = [];
const BUDGETING_TABLES = [
  "assignments",
  "budget_workspaces",
  "category_mappings",
  "envelopes",
  "funding_memberships",
  "rollover_settings",
  "setup_drafts",
] as const;

async function setup(): Promise<SQLiteDatabase> {
  const testDatabase = createTestSQLiteDatabase();
  databases.push(testDatabase);
  await applyLegacyMigrations(testDatabase.database);
  await migrateRecurringRules(testDatabase.database, {
    timeZone: "Asia/Dubai",
    localDate: "2026-08-18",
    now: "2026-08-18T08:00:00.000Z",
  });
  return testDatabase.database;
}

afterEach(() => {
  databases.splice(0).forEach(({ close }) => close());
});

describe("migrateBudgeting", () => {
  it("creates durable budgeting facts without manufacturing an active plan", async () => {
    const database = await setup();

    await migrateBudgeting(database);

    await expect(
      database.getAllAsync<{ name: string }>(
        `SELECT name FROM sqlite_master
         WHERE type = 'table' AND name IN (${BUDGETING_TABLES.map(() => "?").join(", ")})
         ORDER BY name`,
        ...BUDGETING_TABLES,
      ),
    ).resolves.toEqual(BUDGETING_TABLES.map((name) => ({ name })));
    await expect(
      database.getFirstAsync<{
        workspaces: number;
        envelopes: number;
        mappings: number;
        assignments: number;
      }>(
        `SELECT
          (SELECT COUNT(*) FROM budget_workspaces) AS workspaces,
          (SELECT COUNT(*) FROM envelopes) AS envelopes,
          (SELECT COUNT(*) FROM category_mappings) AS mappings,
          (SELECT COUNT(*) FROM assignments) AS assignments`,
      ),
    ).resolves.toEqual({ workspaces: 0, envelopes: 0, mappings: 0, assignments: 0 });
  });

  it("refuses a stamped schema whose durable facts are incomplete", async () => {
    const database = await setup();
    await migrateBudgeting(database);
    await database.execAsync("DROP TABLE assignments");
    await database.execAsync("CREATE TABLE assignments (id TEXT PRIMARY KEY NOT NULL)");

    await expect(migrateBudgeting(database)).rejects.toThrow(
      "stamped as current but its schema is incomplete",
    );
  });

  it("refuses a complete-looking schema whose constraints do not match", async () => {
    const database = await setup();
    await database.execAsync(
      CREATE_BUDGETING_SCHEMA_SQL.replace("amount_minor INTEGER NOT NULL", "amount_minor INTEGER"),
    );

    await expect(migrateBudgeting(database)).rejects.toThrow(
      "does not match the supported structure",
    );
    await expect(
      database.getFirstAsync(
        "SELECT value FROM app_settings WHERE key = ?",
        "budgetingMigrationVersion",
      ),
    ).resolves.toBeNull();
  });

  it("refuses an unsupported migration version instead of treating it as current", async () => {
    const database = await setup();
    await migrateBudgeting(database);
    await database.runAsync(
      "UPDATE app_settings SET value = ? WHERE key = ?",
      "2",
      "budgetingMigrationVersion",
    );

    await expect(migrateBudgeting(database)).rejects.toThrow("unsupported migration version 2");
  });

  it("is idempotent and preserves supported current budgeting data", async () => {
    const database = await setup();
    await migrateBudgeting(database);
    await database.runAsync(
      `INSERT INTO budget_workspaces (
        currency, activation_period, created_at, updated_at
      ) VALUES ('USD', '2026-08', ?, ?)`,
      "2026-08-18T08:00:00.000Z",
      "2026-08-18T08:00:00.000Z",
    );
    await database.runAsync("DELETE FROM app_settings WHERE key = ?", "budgetingMigrationVersion");

    await migrateBudgeting(database);
    await migrateBudgeting(database);

    await expect(
      database.getFirstAsync(
        "SELECT currency, activation_period AS activationPeriod FROM budget_workspaces",
      ),
    ).resolves.toEqual({ currency: "USD", activationPeriod: "2026-08" });
    await expect(
      database.getFirstAsync(
        "SELECT value FROM app_settings WHERE key = ?",
        "budgetingMigrationVersion",
      ),
    ).resolves.toEqual({ value: "1" });
  });

  it("rolls back every schema and stamp change when final validation fails", async () => {
    const database = await setup();
    await database.execAsync("PRAGMA foreign_keys = OFF");
    await database.runAsync(
      `INSERT INTO transactions (
        id, type, amount, currency, date, account_id, is_recurring,
        description, created_at, updated_at
      ) VALUES (
        'orphaned-transaction', 'expense', 1000, 'USD', '2026-08-01',
        'missing-account', 0, '', ?, ?
      )`,
      "2026-08-01T08:00:00.000Z",
      "2026-08-01T08:00:00.000Z",
    );
    await database.execAsync("PRAGMA foreign_keys = ON");

    await expect(migrateBudgeting(database)).rejects.toThrow("invalid foreign keys");

    await expect(
      database.getFirstAsync(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'budget_workspaces'",
      ),
    ).resolves.toBeNull();
    await expect(
      database.getFirstAsync(
        "SELECT value FROM app_settings WHERE key = ?",
        "budgetingMigrationVersion",
      ),
    ).resolves.toBeNull();
  });

  it("refuses partial schema state without stamping or resetting it", async () => {
    const database = await setup();
    await database.execAsync("CREATE TABLE budget_workspaces (currency TEXT PRIMARY KEY NOT NULL)");

    await expect(migrateBudgeting(database)).rejects.toThrow(
      "incomplete budgeting schema and will not guess",
    );
    await expect(
      database.getFirstAsync(
        "SELECT value FROM app_settings WHERE key = ?",
        "budgetingMigrationVersion",
      ),
    ).resolves.toBeNull();
  });

  it("preserves legacy ledger rows while Recurring Rules and budgeting migrate forward", async () => {
    const testDatabase = createTestSQLiteDatabase();
    databases.push(testDatabase);
    const database = testDatabase.database;
    await applyLegacyMigrations(database);
    await database.runAsync(
      `INSERT INTO accounts (
        id, name, type, currency, color, icon, initial_balance,
        exclude_from_total, sort_order, created_at, updated_at
      ) VALUES (
        'account-main', 'Main', 'checking', 'USD', '#8B9D83', '🏦', 10000,
        0, 0, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'
      )`,
    );
    await database.runAsync(
      `INSERT INTO transactions (
        id, type, amount, currency, date, account_id, is_recurring,
        description, created_at, updated_at
      ) VALUES (
        'transaction-1', 'expense', 2500, 'USD', '2026-08-05',
        'account-main', 0, 'Groceries',
        '2026-08-05T08:00:00.000Z', '2026-08-05T08:00:00.000Z'
      )`,
    );

    await migrateRecurringRules(database, {
      timeZone: "Asia/Dubai",
      localDate: "2026-08-18",
      now: "2026-08-18T08:00:00.000Z",
    });
    await migrateBudgeting(database);

    await expect(
      database.getFirstAsync(
        `SELECT id, type, amount, currency, date, account_id AS accountId
         FROM transactions WHERE id = 'transaction-1'`,
      ),
    ).resolves.toEqual({
      id: "transaction-1",
      type: "expense",
      amount: 25_00,
      currency: "USD",
      date: "2026-08-05",
      accountId: "account-main",
    });
  });
});

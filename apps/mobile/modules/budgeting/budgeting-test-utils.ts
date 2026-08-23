import type { SQLiteDatabase } from "expo-sqlite";

import { migrateAccountLifecycle } from "@/db/account-lifecycle-migration";
import { migrateBudgeting } from "@/db/budgeting-migration";
import { migrateCategoryLifecycle } from "@/db/category-lifecycle-migration";
import { migrateRecurringRules } from "@/db/recurring-rules-migration";
import { applyLegacyMigrations, createTestSQLiteDatabase } from "@/tests/test-utils/sqlite";
import type { AccountType, TransactionType } from "@/types";

export async function setupBudgetingDatabase() {
  const testDatabase = createTestSQLiteDatabase();
  await applyLegacyMigrations(testDatabase.database);
  await migrateRecurringRules(testDatabase.database, {
    timeZone: "Asia/Dubai",
    localDate: "2026-08-18",
    now: "2026-08-18T08:00:00.000Z",
  });
  await migrateBudgeting(testDatabase.database);
  await migrateCategoryLifecycle(testDatabase.database);
  await migrateAccountLifecycle(testDatabase.database);
  return testDatabase;
}

export async function insertBudgetAccount(
  database: SQLiteDatabase,
  input: {
    id: string;
    currency?: string;
    initialBalance: number;
    type?: AccountType;
    excludeFromTotal?: boolean;
    lifecycle?: "active" | "archived";
  },
): Promise<void> {
  await database.runAsync(
    `INSERT INTO accounts (
      id, name, type, currency, color, icon, initial_balance,
      exclude_from_total, sort_order, created_at, updated_at
    ) VALUES (?, ?, ?, ?, '#8B9D83', '🏦', ?, ?, 0, ?, ?)`,
    input.id,
    input.id,
    input.type ?? "checking",
    input.currency ?? "USD",
    input.initialBalance,
    input.excludeFromTotal ? 1 : 0,
    "2026-01-01T00:00:00.000Z",
    "2026-01-01T00:00:00.000Z",
  );
  if (input.lifecycle === "archived") {
    await database.runAsync(
      "UPDATE accounts SET lifecycle = 'archived', lifecycle_changed_at = ? WHERE id = ?",
      "2026-08-01T00:00:00.000Z",
      input.id,
    );
  }
}

export async function insertBudgetTransaction(
  database: SQLiteDatabase,
  input: {
    id: string;
    type: TransactionType;
    amount: number;
    currency?: string;
    date: string;
    accountId: string;
    toAccountId?: string;
  },
): Promise<void> {
  await database.runAsync(
    `INSERT INTO transactions (
      id, type, amount, currency, date, account_id, to_account_id,
      is_recurring, description, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, '', ?, ?)`,
    input.id,
    input.type,
    input.amount,
    input.currency ?? "USD",
    input.date,
    input.accountId,
    input.toAccountId ?? null,
    `${input.date}T08:00:00.000Z`,
    `${input.date}T08:00:00.000Z`,
  );
}

export async function countActiveBudgetFacts(database: SQLiteDatabase) {
  const tables = [
    "budget_workspaces",
    "funding_memberships",
    "envelopes",
    "category_mappings",
    "assignments",
    "rollover_settings",
  ] as const;
  return Promise.all(
    tables.map(async (table) => ({
      table,
      count: (
        await database.getFirstAsync<{ count: number }>(`SELECT COUNT(*) AS count FROM ${table}`)
      )?.count,
    })),
  );
}

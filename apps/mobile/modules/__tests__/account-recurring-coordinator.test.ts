import { afterEach, describe, expect, it } from "@jest/globals";
import type { SQLiteDatabase } from "@/db/sqlite";

import { migrateAccountLifecycle } from "@/db/account-lifecycle-migration";
import { migrateBudgeting } from "@/db/budgeting-migration";
import { migrateRecurringRules } from "@/db/recurring-rules-migration";
import { applyLegacyMigrations, createTestSQLiteDatabase } from "@/tests/test-utils/sqlite";

import { updateAccountWithRecurringRules } from "../account-recurring-coordinator";

const databases: { database: SQLiteDatabase; close: VoidFunction }[] = [];

async function setup() {
  const testDatabase = createTestSQLiteDatabase();
  databases.push(testDatabase);
  await applyLegacyMigrations(testDatabase.database);
  await migrateRecurringRules(testDatabase.database, {
    timeZone: "Asia/Dubai",
    localDate: "2026-04-15",
    now: "2026-04-15T08:00:00.000Z",
  });
  await migrateBudgeting(testDatabase.database);
  await migrateAccountLifecycle(testDatabase.database);
  for (const [id, name] of [
    ["account-main", "Main"],
    ["account-savings", "Savings"],
  ] as const) {
    await testDatabase.database.runAsync(
      `INSERT INTO accounts (
        id, name, type, currency, color, icon, initial_balance,
        exclude_from_total, sort_order, created_at, updated_at
      ) VALUES (?, ?, 'checking', 'USD', '#8B9D83', '🏦', 0, 0, 0, ?, ?)`,
      id,
      name,
      "2026-01-01T00:00:00.000Z",
      "2026-01-01T00:00:00.000Z",
    );
  }
  await insertRule(testDatabase.database, "rule-source", "Rent", "account-main", null, "expense");
  await insertRule(
    testDatabase.database,
    "rule-destination",
    "Savings sweep",
    "account-savings",
    "account-main",
    "transfer",
  );
  return testDatabase.database;
}

async function insertRule(
  database: SQLiteDatabase,
  id: string,
  name: string,
  accountId: string,
  toAccountId: string | null,
  type: "expense" | "transfer",
) {
  await database.runAsync(
    `INSERT INTO recurring_rules (
      id, name, type, amount_minor, currency, account_id, to_account_id,
      description, frequency, interval_count, start_date, time_zone,
      lifecycle, health, attention_reasons, eligibility_floor, revision,
      created_at, updated_at
    ) VALUES (?, ?, ?, 10000, 'USD', ?, ?, '', 'month', 1, '2026-01-01',
      'Asia/Dubai', 'active', 'ready', '[]', '2026-01-01', 1, ?, ?)`,
    id,
    name,
    type,
    accountId,
    toAccountId,
    "2026-01-01T00:00:00.000Z",
    "2026-01-01T00:00:00.000Z",
  );
}

afterEach(() => {
  databases.splice(0).forEach(({ close }) => close());
});

describe("Account and Recurring Rules coordination", () => {
  it("marks affected Rules Needs Attention when Account currency changes", async () => {
    const database = await setup();

    await updateAccountWithRecurringRules(database, {
      accountId: "account-main",
      changes: { name: "Main AED", currency: "AED" },
      now: "2026-04-15T08:00:00.000Z",
    });

    await expect(
      database.getFirstAsync("SELECT name, currency FROM accounts WHERE id = ?", "account-main"),
    ).resolves.toEqual({ name: "Main AED", currency: "AED" });
    await expect(
      database.getAllAsync(
        `SELECT id, lifecycle, health, attention_reasons AS attentionReasons, revision
         FROM recurring_rules ORDER BY id`,
      ),
    ).resolves.toEqual([
      {
        id: "rule-destination",
        lifecycle: "active",
        health: "needs_attention",
        attentionReasons: JSON.stringify([
          {
            kind: "account-currency-changed",
            accountId: "account-main",
            expected: "USD",
            actual: "AED",
          },
        ]),
        revision: 2,
      },
      {
        id: "rule-source",
        lifecycle: "active",
        health: "needs_attention",
        attentionReasons: JSON.stringify([
          {
            kind: "account-currency-changed",
            accountId: "account-main",
            expected: "USD",
            actual: "AED",
          },
        ]),
        revision: 2,
      },
    ]);
  });

  it("refuses to rewrite archived Account details", async () => {
    const database = await setup();
    await database.runAsync("UPDATE accounts SET lifecycle = 'archived' WHERE id = 'account-main'");

    await expect(
      updateAccountWithRecurringRules(database, {
        accountId: "account-main",
        changes: { currency: "AED", type: "credit_card" },
        now: "2026-04-15T08:00:00.000Z",
      }),
    ).rejects.toThrow("Restore this Account before editing its details.");
    await expect(
      database.getFirstAsync("SELECT currency, type FROM accounts WHERE id = 'account-main'"),
    ).resolves.toEqual({ currency: "USD", type: "checking" });
  });
});

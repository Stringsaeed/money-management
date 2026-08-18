import { afterEach, describe, expect, it } from "@jest/globals";
import type { SQLiteDatabase } from "expo-sqlite";

import { migrateAccountLifecycle } from "@/db/account-lifecycle-migration";
import { migrateBudgeting } from "@/db/budgeting-migration";
import { migrateCategoryLifecycle } from "@/db/category-lifecycle-migration";
import { migrateRecurringRules } from "@/db/recurring-rules-migration";
import { createBudgetingCoordinator } from "@/modules/budgeting/budgeting";
import { applyLegacyMigrations, createTestSQLiteDatabase } from "@/tests/test-utils/sqlite";

import {
  AccountArchiveBlockedError,
  archiveAccount,
  deleteAccount,
  previewAccountArchival,
  restoreAccount,
} from "./account-lifecycle";

const databases: { database: SQLiteDatabase; close: VoidFunction }[] = [];
const NOW = "2026-08-18T08:00:00.000Z";

async function setup(): Promise<SQLiteDatabase> {
  const testDatabase = createTestSQLiteDatabase();
  databases.push(testDatabase);
  await applyLegacyMigrations(testDatabase.database);
  await migrateRecurringRules(testDatabase.database, {
    timeZone: "Asia/Dubai",
    localDate: "2026-08-18",
    now: NOW,
  });
  await migrateBudgeting(testDatabase.database);
  await migrateCategoryLifecycle(testDatabase.database);
  await migrateAccountLifecycle(testDatabase.database);
  return testDatabase.database;
}

afterEach(() => {
  databases.splice(0).forEach(({ close }) => close());
});

describe("Account lifecycle", () => {
  it("reports every balance and active Recurring Rule prerequisite with recovery actions", async () => {
    const database = await setup();
    await insertAccount(database, "account-main", 25_00);
    await insertAccount(database, "account-other", 0);
    await insertRule(database, {
      id: "rule-rent",
      name: "Rent",
      accountId: "account-main",
      toAccountId: null,
      lifecycle: "active",
    });
    await insertRule(database, {
      id: "rule-transfer",
      name: "Savings transfer",
      accountId: "account-other",
      toAccountId: "account-main",
      lifecycle: "active",
    });

    const preview = await previewAccountArchival(database, "account-main");

    expect(preview).toEqual({
      accountId: "account-main",
      canArchive: false,
      blockers: [
        {
          kind: "non-zero-balance",
          balanceMinor: 25_00,
          recoveryAction: "Record transactions or transfers until this Account balance is zero.",
        },
        {
          kind: "active-recurring-rules",
          rules: [
            { ruleId: "rule-rent", name: "Rent", relationship: "source" },
            {
              ruleId: "rule-transfer",
              name: "Savings transfer",
              relationship: "destination",
            },
          ],
          recoveryAction: "Pause, archive, or repair every listed Recurring Rule.",
        },
      ],
    });

    await expect(
      archiveAccount(database, {
        accountId: "account-main",
        localDate: "2026-08-18",
        now: NOW,
      }),
    ).rejects.toBeInstanceOf(AccountArchiveBlockedError);
    await expect(
      database.getFirstAsync("SELECT lifecycle FROM accounts WHERE id = ?", "account-main"),
    ).resolves.toEqual({ lifecycle: "active" });
  });

  it("archives at zero while preserving ledger, Rule, and historical Funding Pool references", async () => {
    const database = await setup();
    await insertAccount(database, "account-main", 100_00);
    await insertTransaction(database, {
      id: "transaction-spend",
      accountId: "account-main",
      amount: 100_00,
      date: "2026-08-03",
    });
    await insertRule(database, {
      id: "rule-paused",
      name: "Paused rent",
      accountId: "account-main",
      toAccountId: null,
      lifecycle: "paused",
    });
    await activateWorkspace(database, "account-main", "2026-07-15");

    await archiveAccount(database, {
      accountId: "account-main",
      localDate: "2026-08-18",
      now: NOW,
    });

    await expect(
      database.getFirstAsync(
        `SELECT lifecycle, lifecycle_changed_at AS lifecycleChangedAt
         FROM accounts WHERE id = ?`,
        "account-main",
      ),
    ).resolves.toEqual({ lifecycle: "archived", lifecycleChangedAt: NOW });
    await expect(
      database.getFirstAsync(
        "SELECT account_id AS accountId FROM transactions WHERE id = ?",
        "transaction-spend",
      ),
    ).resolves.toEqual({ accountId: "account-main" });
    await expect(
      database.getFirstAsync(
        `SELECT account_id AS accountId, lifecycle, health, attention_reasons AS attentionReasons
         FROM recurring_rules WHERE id = ?`,
        "rule-paused",
      ),
    ).resolves.toEqual({
      accountId: "account-main",
      lifecycle: "paused",
      health: "needs_attention",
      attentionReasons: JSON.stringify([
        { kind: "missing-source-account", formerAccountId: "account-main" },
      ]),
    });
    await expect(
      database.getAllAsync(
        `SELECT effective_from_period AS effectiveFromPeriod,
                effective_to_period AS effectiveToPeriod
         FROM funding_memberships WHERE account_id = ?`,
        "account-main",
      ),
    ).resolves.toEqual([{ effectiveFromPeriod: "2026-07", effectiveToPeriod: "2026-07" }]);

    const budgeting = createBudgetingCoordinator(database);
    await expect(
      budgeting.getProjection({ currency: "USD", period: "2026-07" }),
    ).resolves.toMatchObject({ fundingPool: { amountMinor: 100_00 } });
    await expect(
      budgeting.getProjection({ currency: "USD", period: "2026-08" }),
    ).resolves.toMatchObject({ fundingPool: { amountMinor: 0 } });
  });

  it("rolls back lifecycle and Funding Membership when related Rule changes fail", async () => {
    const database = await setup();
    await insertAccount(database, "account-main", 0);
    await insertRule(database, {
      id: "rule-paused",
      name: "Paused rent",
      accountId: "account-main",
      toAccountId: null,
      lifecycle: "paused",
    });
    await activateWorkspace(database, "account-main", "2026-07-15");
    await database.execAsync(`
      CREATE TRIGGER fail_archived_account_rule_update
      BEFORE UPDATE ON recurring_rules
      WHEN OLD.id = 'rule-paused'
      BEGIN
        SELECT RAISE(ABORT, 'forced Rule update failure');
      END;
    `);

    await expect(
      archiveAccount(database, {
        accountId: "account-main",
        localDate: "2026-08-18",
        now: NOW,
      }),
    ).rejects.toThrow("forced Rule update failure");
    await expect(
      database.getFirstAsync("SELECT lifecycle FROM accounts WHERE id = ?", "account-main"),
    ).resolves.toEqual({ lifecycle: "active" });
    await expect(
      database.getFirstAsync(
        "SELECT effective_to_period AS effectiveToPeriod FROM funding_memberships WHERE account_id = ?",
        "account-main",
      ),
    ).resolves.toEqual({ effectiveToPeriod: null });
  });

  it("restores selection eligibility without restoring Funding Membership", async () => {
    const database = await setup();
    await insertAccount(database, "account-main", 0);
    await insertRule(database, {
      id: "rule-paused",
      name: "Paused rent",
      accountId: "account-main",
      toAccountId: null,
      lifecycle: "paused",
    });
    await activateWorkspace(database, "account-main", "2026-08-01");
    await archiveAccount(database, {
      accountId: "account-main",
      localDate: "2026-08-18",
      now: NOW,
    });

    await restoreAccount(database, {
      accountId: "account-main",
      now: "2026-08-19T08:00:00.000Z",
    });

    await expect(
      database.getFirstAsync("SELECT lifecycle FROM accounts WHERE id = ?", "account-main"),
    ).resolves.toEqual({ lifecycle: "active" });
    await expect(
      database.getFirstAsync(
        "SELECT account_id AS accountId FROM funding_memberships WHERE account_id = ?",
        "account-main",
      ),
    ).resolves.toBeNull();
    await expect(
      database.getFirstAsync(
        "SELECT account_id AS accountId, lifecycle, health FROM recurring_rules WHERE id = ?",
        "rule-paused",
      ),
    ).resolves.toEqual({
      accountId: "account-main",
      lifecycle: "paused",
      health: "needs_attention",
    });
  });

  it("permanently deletes only an Account without ledger or budget history", async () => {
    const database = await setup();
    await insertAccount(database, "account-used", 0);
    await insertTransaction(database, {
      id: "transaction-used",
      accountId: "account-used",
      amount: 0,
      date: "2026-08-03",
    });
    await insertAccount(database, "account-unused", 0);

    await expect(deleteAccount(database, "account-used")).rejects.toThrow(
      "Archive it to preserve its financial history",
    );
    await deleteAccount(database, "account-unused");

    await expect(
      database.getFirstAsync("SELECT id FROM accounts WHERE id = ?", "account-used"),
    ).resolves.toEqual({ id: "account-used" });
    await expect(
      database.getFirstAsync("SELECT id FROM accounts WHERE id = ?", "account-unused"),
    ).resolves.toBeNull();
  });

  it("rejects new activity and Funding Membership for an archived Account", async () => {
    const database = await setup();
    await insertAccount(database, "account-main", 0);
    await archiveAccount(database, {
      accountId: "account-main",
      localDate: "2026-08-18",
      now: NOW,
    });

    await expect(
      database.runAsync(
        `INSERT INTO transactions (
          id, type, amount, currency, date, account_id, is_recurring,
          description, created_at, updated_at
        ) VALUES ('transaction-new', 'expense', 100, 'USD', '2026-08-18',
          'account-main', 0, '', ?, ?)`,
        NOW,
        NOW,
      ),
    ).rejects.toThrow("Archived Account is unavailable for new activity");
    await expect(activateWorkspace(database, "account-main", "2026-08-18")).rejects.toThrow(
      "not eligible for Funding Membership",
    );
  });
});

async function insertAccount(
  database: SQLiteDatabase,
  id: string,
  initialBalance: number,
): Promise<void> {
  await database.runAsync(
    `INSERT INTO accounts (
      id, name, type, currency, color, icon, initial_balance,
      exclude_from_total, sort_order, created_at, updated_at
    ) VALUES (?, ?, 'checking', 'USD', '#8B9D83', '🏦', ?, 0, 0, ?, ?)`,
    id,
    id,
    initialBalance,
    NOW,
    NOW,
  );
}

async function insertTransaction(
  database: SQLiteDatabase,
  input: { id: string; accountId: string; amount: number; date: string },
): Promise<void> {
  await database.runAsync(
    `INSERT INTO transactions (
      id, type, amount, currency, date, account_id, is_recurring,
      description, created_at, updated_at
    ) VALUES (?, 'expense', ?, 'USD', ?, ?, 0, '', ?, ?)`,
    input.id,
    input.amount,
    input.date,
    input.accountId,
    NOW,
    NOW,
  );
}

async function insertRule(
  database: SQLiteDatabase,
  input: {
    id: string;
    name: string;
    accountId: string;
    toAccountId: string | null;
    lifecycle: "active" | "paused";
  },
): Promise<void> {
  await database.runAsync(
    `INSERT INTO recurring_rules (
      id, name, type, amount_minor, currency, account_id, to_account_id,
      category_id, description, frequency, interval_count, start_date, time_zone,
      lifecycle, health, attention_reasons, eligibility_floor, revision, created_at, updated_at
    ) VALUES (?, ?, ?, 1000, 'USD', ?, ?, NULL, '', 'month', 1, '2026-09-01',
      'Asia/Dubai', ?, 'ready', '[]', '2026-09-01', 1, ?, ?)`,
    input.id,
    input.name,
    input.toAccountId ? "transfer" : "expense",
    input.accountId,
    input.toAccountId,
    input.lifecycle,
    NOW,
    NOW,
  );
}

async function activateWorkspace(
  database: SQLiteDatabase,
  accountId: string,
  localDate: string,
): Promise<unknown> {
  return createBudgetingCoordinator(database).activateWorkspace({
    currency: "USD",
    fundingAccountIds: [accountId],
    localDate,
    now: NOW,
  });
}

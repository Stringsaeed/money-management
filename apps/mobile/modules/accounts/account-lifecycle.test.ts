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
  previewAccountDeletion,
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
    await insertAccount(database, "account-other", -50_00);
    await insertRule(database, {
      id: "rule-rent",
      name: "Rent",
      accountId: "account-main",
      toAccountId: null,
      lifecycle: "active",
    });
    await activateWorkspace(database, ["account-main", "account-other"], "2026-08-01");
    await insertRule(database, {
      id: "rule-transfer",
      name: "Savings transfer",
      accountId: "account-other",
      toAccountId: "account-main",
      lifecycle: "active",
    });

    const preview = await previewAccountArchival(database, "account-main", "2026-08-18");

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
          recoveryAction: "Pause or archive every listed Recurring Rule.",
        },
        {
          kind: "budget-dependencies",
          dependencies: [
            {
              kind: "budget-shortfall",
              currency: "USD",
              amountMinor: 50_00,
              recoveryAction:
                "Increase the same-currency Funding Pool or move Money back to Unassigned until the shortfall is zero.",
            },
          ],
          recoveryAction: "Resolve every listed budget dependency before archiving this Account.",
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

  it("reports outstanding Card Payment Reserve and Unfunded Card Spending dependencies", async () => {
    const database = await setup();
    await insertAccount(database, "card-funded", 0, "credit_card");
    await insertAccount(database, "card-unfunded", 0, "credit_card");
    await insertAccount(database, "card-resolved", 0, "credit_card");
    await insertAccount(database, "card-credit", 100_00, "credit_card");
    await insertAccount(database, "card-preactivation-credit", 0, "credit_card");
    await insertAccount(database, "payment-source", 100_00);
    await insertAccount(database, "external-source", 200_00);
    await insertBudgetedCardExpense(database, {
      accountId: "card-funded",
      amount: 100_00,
      assignmentAmount: 100_00,
      suffix: "funded",
    });
    await insertBudgetedCardExpense(database, {
      accountId: "card-unfunded",
      amount: 100_00,
      assignmentAmount: 0,
      suffix: "unfunded",
    });
    await insertBudgetedCardExpense(database, {
      accountId: "card-resolved",
      amount: 100_00,
      assignmentAmount: 100_00,
      suffix: "resolved",
    });
    await insertBudgetedCardExpense(database, {
      accountId: "card-credit",
      amount: 100_00,
      assignmentAmount: 100_00,
      suffix: "credit",
    });
    await database.runAsync(
      `INSERT INTO transactions (
        id, type, amount, currency, date, account_id, is_recurring,
        description, created_at, updated_at
      ) VALUES ('preactivation-card-credit', 'income', 10000, 'USD', '2026-07-20',
        'card-preactivation-credit', 0, '', ?, ?)`,
      NOW,
      NOW,
    );
    await insertBudgetedCardExpense(database, {
      accountId: "card-preactivation-credit",
      amount: 100_00,
      assignmentAmount: 100_00,
      suffix: "preactivation-credit",
    });
    for (const suffix of ["funded", "unfunded"] as const) {
      await database.runAsync(
        `INSERT INTO transactions (
          id, type, amount, currency, date, account_id, to_account_id, is_recurring,
          description, created_at, updated_at
        ) VALUES (?, 'transfer', 10000, 'USD', '2026-08-12',
          'external-source', ?, 0, '', ?, ?)`,
        `external-transfer-${suffix}`,
        `card-${suffix}`,
        NOW,
        NOW,
      );
    }
    await database.runAsync(
      `INSERT INTO funding_memberships (
        account_id, currency, effective_from_period, effective_to_period, created_at
      ) VALUES ('payment-source', 'USD', '2026-08', NULL, ?)`,
      NOW,
    );
    await database.runAsync(
      `INSERT INTO transactions (
        id, type, amount, currency, date, account_id, to_account_id, is_recurring,
        description, created_at, updated_at
      ) VALUES ('payment-resolved', 'transfer', 10000, 'USD', '2026-08-12',
        'payment-source', 'card-resolved', 0, '', ?, ?)`,
      NOW,
      NOW,
    );

    await expect(previewAccountArchival(database, "card-funded", "2026-08-18")).resolves.toEqual({
      accountId: "card-funded",
      canArchive: false,
      blockers: [
        {
          kind: "budget-dependencies",
          dependencies: [
            {
              kind: "card-payment-reserve",
              currency: "USD",
              amountMinor: 100_00,
              recoveryAction:
                "Make a same-currency Card Payment from a Funding Account until this reserve is zero.",
            },
          ],
          recoveryAction: "Resolve every listed budget dependency before archiving this Account.",
        },
      ],
    });
    await expect(previewAccountArchival(database, "card-unfunded", "2026-08-18")).resolves.toEqual({
      accountId: "card-unfunded",
      canArchive: false,
      blockers: [
        {
          kind: "budget-dependencies",
          dependencies: [
            {
              kind: "unfunded-card-spending",
              currency: "USD",
              amountMinor: 100_00,
              recoveryAction:
                "Assign Money to cover this card spending, or pay it from a same-currency Funding Account.",
            },
          ],
          recoveryAction: "Resolve every listed budget dependency before archiving this Account.",
        },
      ],
    });
    await expect(previewAccountArchival(database, "card-resolved", "2026-08-18")).resolves.toEqual({
      accountId: "card-resolved",
      canArchive: true,
      blockers: [],
    });
    await expect(previewAccountArchival(database, "card-credit", "2026-08-18")).resolves.toEqual({
      accountId: "card-credit",
      canArchive: true,
      blockers: [],
    });
    await expect(
      previewAccountArchival(database, "card-preactivation-credit", "2026-08-18"),
    ).resolves.toEqual({
      accountId: "card-preactivation-credit",
      canArchive: true,
      blockers: [],
    });
  });

  it("reports over-assigned Money as a Budget Shortfall", async () => {
    const database = await setup();
    await insertAccount(database, "account-target", 0);
    await insertAccount(database, "account-funding", 50_00);
    await activateWorkspace(database, ["account-target", "account-funding"], "2026-08-01");
    await database.runAsync(
      `INSERT INTO envelopes (
        id, currency, name, icon, color, lifecycle, sort_order, created_at, updated_at
      ) VALUES ('envelope-overassigned', 'USD', 'Overassigned', '✉️', '#8B9D83',
        'active', 0, ?, ?)`,
      NOW,
      NOW,
    );
    await database.runAsync(
      `INSERT INTO assignments (
        id, currency, budget_period, source_envelope_id, destination_envelope_id,
        amount_minor, reverses_assignment_id, created_at
      ) VALUES ('assignment-overassigned', 'USD', '2026-08', NULL,
        'envelope-overassigned', 10000, NULL, ?)`,
      NOW,
    );

    await expect(
      previewAccountArchival(database, "account-target", "2026-08-18"),
    ).resolves.toMatchObject({
      canArchive: false,
      blockers: [
        {
          kind: "budget-dependencies",
          dependencies: [{ kind: "budget-shortfall", amountMinor: 50_00 }],
        },
      ],
    });
  });

  it("replays post-activation cash activity for Funding Pool and card shortfall blockers", async () => {
    const database = await setup();
    await insertAccount(database, "account-target", 0);
    await insertAccount(database, "account-funding", 100_00);
    await insertAccount(database, "card-opening-debt", -100_00, "credit_card");
    await activateWorkspace(database, ["account-target", "account-funding"], "2026-08-01");
    await insertEnvelope(database, { assignmentAmount: 100_00, suffix: "cash-activity" });
    await database.runAsync(
      `INSERT INTO transactions (
        id, type, amount, currency, date, account_id, is_recurring,
        description, created_at, updated_at
      ) VALUES ('unassigned-spending', 'expense', 5000, 'USD', '2026-08-05',
        'account-funding', 0, '', ?, ?)`,
      NOW,
      NOW,
    );

    await expect(
      previewAccountArchival(database, "account-target", "2026-08-18"),
    ).resolves.toMatchObject({
      canArchive: false,
      blockers: [
        {
          kind: "budget-dependencies",
          dependencies: [{ kind: "budget-shortfall", amountMinor: 50_00 }],
        },
      ],
    });

    await database.runAsync(
      `INSERT INTO transactions (
        id, type, amount, currency, date, account_id, to_account_id, is_recurring,
        description, created_at, updated_at
      ) VALUES ('opening-debt-payment', 'transfer', 10000, 'USD', '2026-08-10',
        'account-funding', 'card-opening-debt', 0, '', ?, ?)`,
      NOW,
      NOW,
    );
    await expect(
      previewAccountArchival(database, "card-opening-debt", "2026-08-18"),
    ).resolves.toMatchObject({
      canArchive: false,
      blockers: [
        {
          kind: "budget-dependencies",
          dependencies: [{ kind: "budget-shortfall", amountMinor: 100_00 }],
        },
      ],
    });

    await database.runAsync(
      `INSERT INTO transactions (
        id, type, amount, currency, date, account_id, is_recurring,
        description, created_at, updated_at
      ) VALUES ('funding-income', 'income', 15000, 'USD', '2026-08-12',
        'account-funding', 0, '', ?, ?)`,
      NOW,
      NOW,
    );
    await expect(
      previewAccountArchival(database, "account-target", "2026-08-18"),
    ).resolves.toMatchObject({ canArchive: true, blockers: [] });
    await expect(
      previewAccountArchival(database, "card-opening-debt", "2026-08-18"),
    ).resolves.toMatchObject({ canArchive: true, blockers: [] });
  });

  it("reports cash Envelope Overspending as a distinct budget dependency", async () => {
    const database = await setup();
    await insertAccount(database, "account-target", 0);
    await insertAccount(database, "account-funding", 100_00);
    await activateWorkspace(database, ["account-target", "account-funding"], "2026-08-01");
    await insertEnvelope(database, {
      assignmentAmount: 80_00,
      categoryId: "category-cash-overspending",
      suffix: "cash-overspending",
    });
    await database.runAsync(
      `INSERT INTO transactions (
        id, type, amount, currency, date, account_id, category_id, is_recurring,
        description, created_at, updated_at
      ) VALUES ('cash-overspending', 'expense', 10000, 'USD', '2026-08-10',
        'account-funding', 'category-cash-overspending', 0, '', ?, ?)`,
      NOW,
      NOW,
    );

    await expect(
      previewAccountArchival(database, "account-target", "2026-08-18"),
    ).resolves.toMatchObject({
      canArchive: false,
      blockers: [
        {
          kind: "budget-dependencies",
          dependencies: [{ kind: "cash-envelope-overspending", amountMinor: 20_00 }],
        },
      ],
    });
  });

  it("evaluates the budget after current-period Funding Membership ends", async () => {
    const database = await setup();
    await insertAccount(database, "account-target", 100_00);
    await activateWorkspace(database, "account-target", "2026-08-01");
    await insertEnvelope(database, {
      assignmentAmount: 100_00,
      categoryId: "category-membership-end",
      suffix: "membership-end",
    });
    await database.runAsync(
      `INSERT INTO transactions (
        id, type, amount, currency, date, account_id, category_id, is_recurring,
        description, created_at, updated_at
      ) VALUES ('membership-end-spend', 'expense', 10000, 'USD', '2026-08-10',
        'account-target', 'category-membership-end', 0, '', ?, ?)`,
      NOW,
      NOW,
    );

    await expect(
      previewAccountArchival(database, "account-target", "2026-08-18"),
    ).resolves.toMatchObject({
      canArchive: false,
      blockers: [
        {
          kind: "budget-dependencies",
          dependencies: [{ kind: "budget-shortfall", amountMinor: 100_00 }],
        },
      ],
    });
    await expect(
      archiveAccount(database, {
        accountId: "account-target",
        localDate: "2026-08-18",
        now: NOW,
      }),
    ).rejects.toBeInstanceOf(AccountArchiveBlockedError);
    await expect(
      database.getFirstAsync("SELECT lifecycle FROM accounts WHERE id = ?", "account-target"),
    ).resolves.toEqual({ lifecycle: "active" });
  });

  it("blocks unsupported cross-currency Transfers without replaying their amount", async () => {
    const database = await setup();
    await insertAccount(database, "account-target", 100_00);
    await insertAccount(database, "account-eur", 0, "checking", "EUR");
    await activateWorkspace(database, "account-target", "2026-08-01");
    await database.runAsync(
      `INSERT INTO transactions (
        id, type, amount, currency, date, account_id, to_account_id, is_recurring,
        description, created_at, updated_at
      ) VALUES ('cross-currency-transfer', 'transfer', 10000, 'USD', '2026-08-10',
        'account-target', 'account-eur', 0, '', ?, ?)`,
      NOW,
      NOW,
    );

    await expect(previewAccountArchival(database, "account-target", "2026-08-18")).resolves.toEqual(
      {
        accountId: "account-target",
        canArchive: false,
        blockers: [
          {
            kind: "budget-dependencies",
            dependencies: [
              {
                kind: "unsupported-cross-currency-transfer",
                amountMinor: 100_00,
                currency: "USD",
                destinationCurrency: "EUR",
                recoveryAction:
                  "Correct this Transfer to use same-currency Accounts, or remove it before archiving.",
                transactionId: "cross-currency-transfer",
              },
            ],
            recoveryAction: "Resolve every listed budget dependency before archiving this Account.",
          },
        ],
      },
    );
  });

  it("blocks a cross-currency Transfer from an Account without its own workspace", async () => {
    const database = await setup();
    await insertAccount(database, "account-eur", 100_00, "checking", "EUR");
    await insertAccount(database, "account-usd", 0);
    await activateWorkspace(database, "account-usd", "2026-08-01");
    await database.runAsync(
      `INSERT INTO transactions (
        id, type, amount, currency, date, account_id, to_account_id, is_recurring,
        description, created_at, updated_at
      ) VALUES ('cross-currency-no-source-workspace', 'transfer', 10000, 'EUR', '2026-08-10',
        'account-eur', 'account-usd', 0, '', ?, ?)`,
      NOW,
      NOW,
    );

    await expect(
      previewAccountArchival(database, "account-eur", "2026-08-18"),
    ).resolves.toMatchObject({
      canArchive: false,
      blockers: [
        {
          kind: "budget-dependencies",
          dependencies: [
            {
              kind: "unsupported-cross-currency-transfer",
              currency: "EUR",
              destinationCurrency: "USD",
              transactionId: "cross-currency-no-source-workspace",
            },
          ],
        },
      ],
    });
  });

  it("keeps the historical Money currency when an active endpoint currency drifts", async () => {
    const database = await setup();
    await insertAccount(database, "account-source", 100_00);
    await insertAccount(database, "account-eur", 0, "checking", "EUR");
    await activateWorkspace(database, "account-source", "2026-08-01");
    await database.runAsync(
      `INSERT INTO transactions (
        id, type, amount, currency, date, account_id, to_account_id, is_recurring,
        description, created_at, updated_at
      ) VALUES ('cross-currency-history', 'transfer', 10000, 'USD', '2026-08-10',
        'account-source', 'account-eur', 0, '', ?, ?)`,
      NOW,
      NOW,
    );
    await database.runAsync("UPDATE accounts SET currency = 'EUR' WHERE id = ?", "account-source");

    await expect(
      previewAccountArchival(database, "account-source", "2026-08-18"),
    ).resolves.toMatchObject({
      canArchive: false,
      blockers: [
        {
          kind: "budget-dependencies",
          dependencies: [
            {
              kind: "unsupported-cross-currency-transfer",
              amountMinor: 100_00,
              currency: "USD",
              destinationCurrency: "EUR",
              transactionId: "cross-currency-history",
            },
          ],
        },
      ],
    });
  });

  it("shares Envelope availability with cash spending and funds older card deficits first", async () => {
    const database = await setup();
    await insertAccount(database, "card-shared", 0, "credit_card");
    await insertAccount(database, "cash-funding", 100_00);
    await insertAccount(database, "external-source", 100_00);
    await insertBudgetedCardExpense(database, {
      accountId: "card-shared",
      amount: 100_00,
      assignmentAmount: 0,
      suffix: "shared",
    });
    await database.runAsync(
      `INSERT INTO funding_memberships (
        account_id, currency, effective_from_period, effective_to_period, created_at
      ) VALUES ('cash-funding', 'USD', '2026-08', NULL, ?)`,
      NOW,
    );
    await database.runAsync(
      `INSERT INTO transactions (
        id, type, amount, currency, date, account_id, category_id, is_recurring,
        description, created_at, updated_at
      ) VALUES ('cash-spending-shared', 'expense', 10000, 'USD', '2026-08-05',
        'cash-funding', 'category-shared', 0, '', ?, ?)`,
      NOW,
      NOW,
    );
    await database.runAsync(
      `INSERT INTO transactions (
        id, type, amount, currency, date, account_id, to_account_id, is_recurring,
        description, created_at, updated_at
      ) VALUES ('external-transfer-shared', 'transfer', 10000, 'USD', '2026-08-12',
        'external-source', 'card-shared', 0, '', ?, ?)`,
      NOW,
      NOW,
    );

    await expect(
      previewAccountArchival(database, "card-shared", "2026-08-18"),
    ).resolves.toMatchObject({
      canArchive: false,
      blockers: [
        {
          kind: "budget-dependencies",
          dependencies: [{ kind: "unfunded-card-spending", amountMinor: 100_00 }],
        },
      ],
    });

    await database.runAsync(
      `INSERT INTO assignments (
        id, currency, budget_period, source_envelope_id, destination_envelope_id,
        amount_minor, reverses_assignment_id, created_at
      ) VALUES ('assignment-shared-recovery', 'USD', '2026-09', NULL,
        'envelope-shared', 15000, NULL, ?)`,
      NOW,
    );
    await expect(
      previewAccountArchival(database, "card-shared", "2026-09-18"),
    ).resolves.toMatchObject({
      canArchive: false,
      blockers: [
        {
          kind: "budget-dependencies",
          dependencies: [
            { kind: "card-payment-reserve", amountMinor: 50_00 },
            { kind: "unfunded-card-spending", amountMinor: 50_00 },
          ],
        },
      ],
    });
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
    await expect(previewAccountDeletion(database, "account-main")).resolves.toMatchObject({
      budgetHistoryCount: 1,
      canDelete: false,
    });
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
    await insertTransaction(database, {
      id: "transaction-existing",
      accountId: "account-main",
      amount: 0,
      date: "2026-07-03",
    });
    await activateWorkspace(database, "account-main", "2026-07-01");
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
    await expect(
      database.runAsync(
        "UPDATE transactions SET amount = 100 WHERE id = ?",
        "transaction-existing",
      ),
    ).rejects.toThrow("Restore the Archived Account before correcting its activity");
    await expect(
      database.runAsync("DELETE FROM transactions WHERE id = ?", "transaction-existing"),
    ).rejects.toThrow("Restore the Archived Account before correcting its activity");
    await expect(
      database.runAsync("UPDATE accounts SET initial_balance = 100 WHERE id = ?", "account-main"),
    ).rejects.toThrow("Restore the Archived Account before correcting historical details");
    await expect(
      database.runAsync("UPDATE accounts SET currency = 'EUR' WHERE id = ?", "account-main"),
    ).rejects.toThrow("Restore the Archived Account before correcting historical details");
    await expect(
      database.runAsync(
        "UPDATE funding_memberships SET effective_to_period = NULL WHERE account_id = ?",
        "account-main",
      ),
    ).rejects.toThrow("Archived Account cannot join a Funding Pool");
    await expect(
      database.runAsync("DELETE FROM funding_memberships WHERE account_id = ?", "account-main"),
    ).rejects.toThrow("Restore the Archived Account before correcting Funding Membership");
  });
});

async function insertAccount(
  database: SQLiteDatabase,
  id: string,
  initialBalance: number,
  type = "checking",
  currency = "USD",
): Promise<void> {
  await database.runAsync(
    `INSERT INTO accounts (
      id, name, type, currency, color, icon, initial_balance,
      exclude_from_total, sort_order, created_at, updated_at
    ) VALUES (?, ?, ?, ?, '#8B9D83', '🏦', ?, 0, 0, ?, ?)`,
    id,
    id,
    type,
    currency,
    initialBalance,
    NOW,
    NOW,
  );
}

async function insertEnvelope(
  database: SQLiteDatabase,
  input: { assignmentAmount: number; categoryId?: string; suffix: string },
): Promise<void> {
  const envelopeId = `envelope-${input.suffix}`;
  await database.runAsync(
    `INSERT INTO envelopes (
      id, currency, name, icon, color, lifecycle, sort_order, created_at, updated_at
    ) VALUES (?, 'USD', ?, '✉️', '#8B9D83', 'active', 0, ?, ?)`,
    envelopeId,
    envelopeId,
    NOW,
    NOW,
  );
  if (input.categoryId) {
    await database.runAsync(
      `INSERT INTO categories (
        id, name, type, color, icon, sort_order, created_at, updated_at
      ) VALUES (?, ?, 'expense', '#B48A7B', '🏷️', 0, ?, ?)`,
      input.categoryId,
      input.categoryId,
      NOW,
      NOW,
    );
    await database.runAsync(
      `INSERT INTO category_mappings (
        category_id, envelope_id, effective_from_period, effective_to_period, created_at
      ) VALUES (?, ?, '2026-08', NULL, ?)`,
      input.categoryId,
      envelopeId,
      NOW,
    );
  }
  await database.runAsync(
    `INSERT INTO assignments (
      id, currency, budget_period, source_envelope_id, destination_envelope_id,
      amount_minor, reverses_assignment_id, created_at
    ) VALUES (?, 'USD', '2026-08', NULL, ?, ?, NULL, ?)`,
    `assignment-${input.suffix}`,
    envelopeId,
    input.assignmentAmount,
    NOW,
  );
}

async function insertBudgetedCardExpense(
  database: SQLiteDatabase,
  input: { accountId: string; amount: number; assignmentAmount: number; suffix: string },
): Promise<void> {
  const categoryId = `category-${input.suffix}`;
  const envelopeId = `envelope-${input.suffix}`;
  await database.runAsync(
    `INSERT INTO categories (
      id, name, type, color, icon, sort_order, created_at, updated_at
    ) VALUES (?, ?, 'expense', '#B48A7B', '🏷️', 0, ?, ?)`,
    categoryId,
    categoryId,
    NOW,
    NOW,
  );
  await database.runAsync(
    `INSERT INTO budget_workspaces (currency, activation_period, created_at, updated_at)
     VALUES ('USD', '2026-08', ?, ?)
     ON CONFLICT(currency) DO NOTHING`,
    NOW,
    NOW,
  );
  await database.runAsync(
    `INSERT INTO envelopes (
      id, currency, name, icon, color, lifecycle, sort_order, created_at, updated_at
    ) VALUES (?, 'USD', ?, '✉️', '#8B9D83', 'active', 0, ?, ?)`,
    envelopeId,
    envelopeId,
    NOW,
    NOW,
  );
  await database.runAsync(
    `INSERT INTO category_mappings (
      category_id, envelope_id, effective_from_period, effective_to_period, created_at
    ) VALUES (?, ?, '2026-08', NULL, ?)`,
    categoryId,
    envelopeId,
    NOW,
  );
  if (input.assignmentAmount > 0) {
    await database.runAsync(
      `INSERT INTO assignments (
        id, currency, budget_period, source_envelope_id, destination_envelope_id,
        amount_minor, reverses_assignment_id, created_at
      ) VALUES (?, 'USD', '2026-08', NULL, ?, ?, NULL, ?)`,
      `assignment-${input.suffix}`,
      envelopeId,
      input.assignmentAmount,
      NOW,
    );
  }
  await database.runAsync(
    `INSERT INTO transactions (
      id, type, amount, currency, date, account_id, category_id, is_recurring,
      description, created_at, updated_at
    ) VALUES (?, 'expense', ?, 'USD', '2026-08-10', ?, ?, 0, '', ?, ?)`,
    `transaction-${input.suffix}`,
    input.amount,
    input.accountId,
    categoryId,
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
  accountIds: string | readonly string[],
  localDate: string,
): Promise<unknown> {
  return createBudgetingCoordinator(database).activateWorkspace({
    currency: "USD",
    fundingAccountIds: typeof accountIds === "string" ? [accountIds] : accountIds,
    localDate,
    now: NOW,
  });
}

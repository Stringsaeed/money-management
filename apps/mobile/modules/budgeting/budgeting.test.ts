import { afterEach, describe, expect, it } from "@jest/globals";
import { QueryClient, QueryObserver } from "@tanstack/react-query";
import type { SQLiteDatabase } from "expo-sqlite";

import { migrateAccountLifecycle } from "@/db/account-lifecycle-migration";
import { migrateBudgeting } from "@/db/budgeting-migration";
import { migrateRecurringRules } from "@/db/recurring-rules-migration";
import { applyLegacyMigrations, createTestSQLiteDatabase } from "@/tests/test-utils/sqlite";
import { budgetKeys } from "@/modules/ledger-cache";

import { createBudgetingCoordinator } from "./budgeting";

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
  await migrateAccountLifecycle(testDatabase.database);
  return testDatabase.database;
}

afterEach(() => {
  databases.splice(0).forEach(({ close }) => close());
});

describe("Budgeting coordinator", () => {
  it("keeps Funding Pools independent across currency workspaces", async () => {
    const database = await setup();
    await insertAccount(database, {
      id: "account-usd",
      currency: "USD",
      initialBalance: 100_00,
    });
    await insertAccount(database, {
      id: "account-aed",
      currency: "AED",
      initialBalance: 500_00,
    });
    await insertTransaction(database, {
      id: "usd-income",
      type: "income",
      amount: 25_00,
      currency: "USD",
      date: "2026-08-10",
      accountId: "account-usd",
    });
    await insertTransaction(database, {
      id: "aed-expense",
      type: "expense",
      amount: 40_00,
      currency: "AED",
      date: "2026-08-11",
      accountId: "account-aed",
    });
    const budgeting = createBudgetingCoordinator(database);

    const usd = await budgeting.activateWorkspace({
      currency: "USD",
      fundingAccountIds: ["account-usd"],
      localDate: "2026-08-18",
      now: "2026-08-18T08:00:00.000Z",
    });
    const aed = await budgeting.activateWorkspace({
      currency: "AED",
      fundingAccountIds: ["account-aed"],
      localDate: "2026-08-18",
      now: "2026-08-18T08:01:00.000Z",
    });

    expect(usd.fundingPool).toEqual({ currency: "USD", amountMinor: 125_00 });
    expect(usd.unassignedMoney).toEqual({ currency: "USD", amountMinor: 125_00 });
    expect(aed.fundingPool).toEqual({ currency: "AED", amountMinor: 460_00 });
    expect(aed.unassignedMoney).toEqual({ currency: "AED", amountMinor: 460_00 });
  });

  it("reconstructs the period opening and replays current activity exactly once", async () => {
    const database = await setup();
    await database.runAsync(
      `INSERT INTO accounts (
        id, name, type, currency, color, icon, initial_balance,
        exclude_from_total, sort_order, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      "account-main",
      "Main",
      "checking",
      "USD",
      "#8B9D83",
      "🏦",
      100_00,
      0,
      0,
      "2026-01-01T00:00:00.000Z",
      "2026-01-01T00:00:00.000Z",
    );
    await database.runAsync(
      `INSERT INTO transactions (
        id, type, amount, currency, date, account_id, is_recurring,
        description, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      "income-current",
      "income",
      25_00,
      "USD",
      "2026-08-05",
      "account-main",
      0,
      "Posted salary",
      "2026-08-05T08:00:00.000Z",
      "2026-08-05T08:00:00.000Z",
    );
    await database.runAsync(
      `INSERT INTO transactions (
        id, type, amount, currency, date, account_id, is_recurring,
        description, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      "expense-current",
      "expense",
      10_00,
      "USD",
      "2026-08-09",
      "account-main",
      0,
      "Groceries",
      "2026-08-09T08:00:00.000Z",
      "2026-08-09T08:00:00.000Z",
    );
    await database.runAsync(
      `INSERT INTO transactions (
        id, type, amount, currency, date, account_id, is_recurring,
        description, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      "income-earlier",
      "income",
      90_00,
      "USD",
      "2026-07-31",
      "account-main",
      0,
      "Earlier income",
      "2026-07-31T08:00:00.000Z",
      "2026-07-31T08:00:00.000Z",
    );

    const budgeting = createBudgetingCoordinator(database);
    const projection = await budgeting.activateWorkspace({
      currency: "USD",
      fundingAccountIds: ["account-main"],
      localDate: "2026-08-18",
      now: "2026-08-18T08:00:00.000Z",
    });

    expect(projection).toEqual({
      currency: "USD",
      period: "2026-08",
      fundingPool: { currency: "USD", amountMinor: 205_00 },
      unassignedMoney: { currency: "USD", amountMinor: 205_00 },
      budgetHealth: { status: "ready", reasons: [] },
    });
    await expect(budgeting.getProjection({ currency: "USD", period: "2026-08" })).resolves.toEqual(
      projection,
    );
  });

  it("does not duplicate durable activation facts or replay activity on retry", async () => {
    const database = await setup();
    await database.runAsync(
      `INSERT INTO accounts (
        id, name, type, currency, color, icon, initial_balance,
        exclude_from_total, sort_order, created_at, updated_at
      ) VALUES ('account-main', 'Main', 'checking', 'USD', '#8B9D83', '🏦',
        10000, 0, 0, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z')`,
    );
    const request = {
      currency: "USD",
      fundingAccountIds: ["account-main"],
      localDate: "2026-08-18",
      now: "2026-08-18T08:00:00.000Z",
    } as const;
    const budgeting = createBudgetingCoordinator(database);

    const firstProjection = await budgeting.activateWorkspace(request);
    const retriedProjection = await budgeting.activateWorkspace(request);

    expect(retriedProjection).toEqual(firstProjection);
    await expect(
      database.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) AS count FROM funding_memberships",
      ),
    ).resolves.toEqual({ count: 1 });
  });

  it("applies Funding Membership changes to the current and future periods only", async () => {
    const database = await setup();
    await insertAccount(database, { id: "account-main", initialBalance: 100_00 });
    await insertAccount(database, { id: "account-savings", initialBalance: 50_00 });
    await insertTransaction(database, {
      id: "savings-before-change-period",
      type: "income",
      amount: 20_00,
      date: "2026-07-20",
      accountId: "account-savings",
    });
    await insertTransaction(database, {
      id: "savings-in-change-period",
      type: "income",
      amount: 10_00,
      date: "2026-08-05",
      accountId: "account-savings",
    });
    const budgeting = createBudgetingCoordinator(database);
    await budgeting.activateWorkspace({
      currency: "USD",
      fundingAccountIds: ["account-main"],
      localDate: "2026-01-15",
      now: "2026-01-15T08:00:00.000Z",
    });

    await budgeting.updateFundingMembership({
      accountId: "account-savings",
      included: true,
      localDate: "2026-08-18",
      now: "2026-08-18T08:00:00.000Z",
    });

    await expect(
      budgeting.getProjection({ currency: "USD", period: "2026-07" }),
    ).resolves.toMatchObject({
      fundingPool: { currency: "USD", amountMinor: 100_00 },
    });
    await expect(
      budgeting.getProjection({ currency: "USD", period: "2026-08" }),
    ).resolves.toMatchObject({
      fundingPool: { currency: "USD", amountMinor: 180_00 },
    });
    await expect(
      budgeting.getProjection({ currency: "USD", period: "2026-09" }),
    ).resolves.toMatchObject({
      fundingPool: { currency: "USD", amountMinor: 180_00 },
    });
  });

  it("removes Funding Membership for the whole current period without rewriting history", async () => {
    const database = await setup();
    await insertAccount(database, { id: "account-main", initialBalance: 100_00 });
    const budgeting = createBudgetingCoordinator(database);
    await budgeting.activateWorkspace({
      currency: "USD",
      fundingAccountIds: ["account-main"],
      localDate: "2026-01-15",
      now: "2026-01-15T08:00:00.000Z",
    });

    const current = await budgeting.updateFundingMembership({
      accountId: "account-main",
      included: false,
      localDate: "2026-08-18",
      now: "2026-08-18T08:00:00.000Z",
    });

    expect(current.fundingPool).toEqual({ currency: "USD", amountMinor: 0 });
    await expect(
      budgeting.getProjection({ currency: "USD", period: "2026-07" }),
    ).resolves.toMatchObject({
      fundingPool: { currency: "USD", amountMinor: 100_00 },
    });
    await expect(
      budgeting.getProjection({ currency: "USD", period: "2026-09" }),
    ).resolves.toMatchObject({
      fundingPool: { currency: "USD", amountMinor: 0 },
    });
  });

  it("suggests active cash-backed Accounts independently from Home-total visibility", async () => {
    const database = await setup();
    await insertAccount(database, {
      id: "account-checking",
      initialBalance: 100_00,
      excludeFromTotal: true,
    });
    await insertAccount(database, {
      id: "account-savings",
      initialBalance: 50_00,
      type: "savings",
    });
    await insertAccount(database, { id: "account-cash", initialBalance: 20_00, type: "cash" });
    await insertAccount(database, { id: "account-other", initialBalance: 10_00, type: "other" });
    await insertAccount(database, {
      id: "account-card",
      initialBalance: 0,
      type: "credit_card",
    });
    await insertAccount(database, {
      id: "account-investment",
      initialBalance: 500_00,
      type: "investment",
    });
    await insertAccount(database, {
      id: "account-archived",
      initialBalance: 0,
      lifecycle: "archived",
    });

    await expect(
      createBudgetingCoordinator(database).getFundingAccountSuggestions({ currency: "USD" }),
    ).resolves.toEqual([
      {
        id: "account-cash",
        currency: "USD",
        type: "cash",
        excludedFromHomeTotal: false,
        suggested: true,
      },
      {
        id: "account-checking",
        currency: "USD",
        type: "checking",
        excludedFromHomeTotal: true,
        suggested: true,
      },
      {
        id: "account-savings",
        currency: "USD",
        type: "savings",
        excludedFromHomeTotal: false,
        suggested: true,
      },
      {
        id: "account-card",
        currency: "USD",
        type: "credit_card",
        excludedFromHomeTotal: false,
        suggested: false,
      },
      {
        id: "account-investment",
        currency: "USD",
        type: "investment",
        excludedFromHomeTotal: false,
        suggested: false,
      },
      {
        id: "account-other",
        currency: "USD",
        type: "other",
        excludedFromHomeTotal: false,
        suggested: false,
      },
    ]);
  });

  it("uses a deterministic Home Currency fallback and remembers workspace selection", async () => {
    const database = await setup();
    await insertAccount(database, { id: "account-usd", initialBalance: 100_00 });
    await insertAccount(database, {
      id: "account-aed",
      currency: "AED",
      initialBalance: 500_00,
    });
    const budgeting = createBudgetingCoordinator(database);
    await budgeting.activateWorkspace({
      currency: "USD",
      fundingAccountIds: ["account-usd"],
      localDate: "2026-08-18",
      now: "2026-08-18T08:00:00.000Z",
    });
    await budgeting.activateWorkspace({
      currency: "AED",
      fundingAccountIds: ["account-aed"],
      localDate: "2026-08-18",
      now: "2026-08-18T08:01:00.000Z",
    });

    await expect(budgeting.getWorkspaceSelection()).resolves.toEqual({
      workspaces: [
        { currency: "AED", activationPeriod: "2026-08" },
        { currency: "USD", activationPeriod: "2026-08" },
      ],
      homeCurrency: "AED",
      hasExplicitHomeCurrency: false,
      selectedCurrency: "AED",
    });

    await budgeting.setHomeCurrency({ currency: "USD" });
    await budgeting.selectWorkspace({ currency: "AED" });

    await expect(createBudgetingCoordinator(database).getWorkspaceSelection()).resolves.toEqual({
      workspaces: [
        { currency: "AED", activationPeriod: "2026-08" },
        { currency: "USD", activationPeriod: "2026-08" },
      ],
      homeCurrency: "USD",
      hasExplicitHomeCurrency: true,
      selectedCurrency: "AED",
    });
  });

  it("replays posted stored-date activity once while excluding unsettled expected income", async () => {
    const database = await setup();
    await insertAccount(database, { id: "account-main", initialBalance: 100_00 });
    await insertAccount(database, { id: "account-overdrawn", initialBalance: -20_00 });
    await insertTransaction(database, {
      id: "internal-transfer",
      type: "transfer",
      amount: 25_00,
      date: "2026-08-10",
      accountId: "account-main",
      toAccountId: "account-overdrawn",
    });
    await database.runAsync(
      `INSERT INTO recurring_rules (
        id, name, type, amount_minor, currency, account_id, description,
        frequency, interval_count, start_date, time_zone, lifecycle, health,
        attention_reasons, eligibility_floor, revision, created_at, updated_at
      ) VALUES (
        'expected-income', 'Expected salary', 'income', 90000, 'USD',
        'account-main', '', 'month', 1, '2026-08-20', 'Asia/Dubai',
        'active', 'ready', '[]', '2026-08-20', 1,
        '2026-08-01T00:00:00.000Z', '2026-08-01T00:00:00.000Z'
      )`,
    );

    const projection = await createBudgetingCoordinator(database).activateWorkspace({
      currency: "USD",
      fundingAccountIds: ["account-main", "account-overdrawn"],
      localDate: "2026-08-18",
      now: "2026-08-18T08:00:00.000Z",
    });

    expect(projection.fundingPool).toEqual({ currency: "USD", amountMinor: 80_00 });
  });

  it("keeps internal transfers neutral and applies Funding Boundary Transfers exactly", async () => {
    const database = await setup();
    await insertAccount(database, { id: "account-main", initialBalance: 20_00 });
    await insertAccount(database, { id: "account-overdrawn", initialBalance: -10_00 });
    await insertAccount(database, { id: "account-outside", initialBalance: 0 });
    await insertTransaction(database, {
      id: "internal",
      type: "transfer",
      amount: 5_00,
      date: "2026-08-02",
      accountId: "account-main",
      toAccountId: "account-overdrawn",
    });
    await insertTransaction(database, {
      id: "entering",
      type: "transfer",
      amount: 3_00,
      date: "2026-08-03",
      accountId: "account-outside",
      toAccountId: "account-main",
    });
    await insertTransaction(database, {
      id: "leaving",
      type: "transfer",
      amount: 25_00,
      date: "2026-08-04",
      accountId: "account-main",
      toAccountId: "account-outside",
    });

    const projection = await createBudgetingCoordinator(database).activateWorkspace({
      currency: "USD",
      fundingAccountIds: ["account-main", "account-overdrawn"],
      localDate: "2026-08-18",
      now: "2026-08-18T08:00:00.000Z",
    });

    expect(projection.fundingPool).toEqual({ currency: "USD", amountMinor: -12_00 });
    expect(projection.unassignedMoney).toEqual({ currency: "USD", amountMinor: -12_00 });
    expect(projection.budgetHealth).toEqual({
      status: "needs_attention",
      reasons: [
        {
          kind: "budget-shortfall",
          currency: "USD",
          amountMinor: 12_00,
          recoveryAction:
            "Increase the same-currency Funding Pool or move Money back to Unassigned until the shortfall is zero.",
        },
      ],
    });
  });

  it("excludes one-amount cross-currency transfers with a resolvable workspace reason", async () => {
    const database = await setup();
    await insertAccount(database, { id: "account-usd", initialBalance: 100_00 });
    await insertAccount(database, {
      id: "account-aed",
      currency: "AED",
      initialBalance: 50_00,
    });
    await insertTransaction(database, {
      id: "unsupported-transfer",
      type: "transfer",
      amount: 10_00,
      date: "2026-08-10",
      accountId: "account-usd",
      toAccountId: "account-aed",
    });

    const projection = await createBudgetingCoordinator(database).activateWorkspace({
      currency: "USD",
      fundingAccountIds: ["account-usd"],
      localDate: "2026-08-18",
      now: "2026-08-18T08:00:00.000Z",
    });

    expect(projection).toEqual({
      currency: "USD",
      period: "2026-08",
      fundingPool: { currency: "USD", amountMinor: 100_00 },
      unassignedMoney: { currency: "USD", amountMinor: 100_00 },
      budgetHealth: {
        status: "needs_attention",
        reasons: [
          {
            kind: "unsupported-cross-currency-transfer",
            transactionId: "unsupported-transfer",
            sourceCurrency: "USD",
            destinationCurrency: "AED",
            recoveryAction: "Replace this transfer with exact same-currency ledger records.",
          },
        ],
      },
    });
  });

  it("rolls back every activation fact when persistence fails", async () => {
    const database = await setup();
    await insertAccount(database, { id: "account-main", initialBalance: 100_00 });
    await insertAccount(database, { id: "account-savings", initialBalance: 50_00 });
    await database.execAsync(`
      CREATE TRIGGER fail_second_membership
      BEFORE INSERT ON funding_memberships
      WHEN NEW.account_id = 'account-savings'
      BEGIN
        SELECT RAISE(ABORT, 'forced activation failure');
      END;
    `);

    await expect(
      createBudgetingCoordinator(database).activateWorkspace({
        currency: "USD",
        fundingAccountIds: ["account-main", "account-savings"],
        localDate: "2026-08-18",
        now: "2026-08-18T08:00:00.000Z",
      }),
    ).rejects.toThrow("forced activation failure");
    await expect(
      database.getFirstAsync<{ workspaces: number; memberships: number }>(
        `SELECT
          (SELECT COUNT(*) FROM budget_workspaces) AS workspaces,
          (SELECT COUNT(*) FROM funding_memberships) AS memberships`,
      ),
    ).resolves.toEqual({ workspaces: 0, memberships: 0 });
  });

  it("keeps a committed activation successful when its active projection refresh fails", async () => {
    const database = await setup();
    await insertAccount(database, { id: "account-main", initialBalance: 100_00 });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });
    const refreshError = new Error("projection refresh failed");
    const queryKey = budgetKeys.projection("USD", "2026-08");
    const queryFn = jest.fn().mockResolvedValueOnce(null).mockRejectedValueOnce(refreshError);
    const options = { queryKey, queryFn, staleTime: Infinity };
    await queryClient.fetchQuery(options);
    const observer = new QueryObserver(queryClient, options);
    const unsubscribe = observer.subscribe(() => undefined);
    const budgeting = createBudgetingCoordinator(database, { queryClient });

    await expect(
      budgeting.activateWorkspace({
        currency: "USD",
        fundingAccountIds: ["account-main"],
        localDate: "2026-08-18",
        now: "2026-08-18T08:00:00.000Z",
      }),
    ).resolves.toMatchObject({ currency: "USD", period: "2026-08" });
    expect(queryClient.getQueryState(queryKey)).toMatchObject({
      error: refreshError,
      status: "error",
    });

    unsubscribe();
    queryClient.clear();
  });
});

async function insertAccount(
  database: SQLiteDatabase,
  input: {
    id: string;
    currency?: string;
    initialBalance: number;
    type?: string;
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

async function insertTransaction(
  database: SQLiteDatabase,
  input: {
    id: string;
    type: "income" | "expense" | "transfer";
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

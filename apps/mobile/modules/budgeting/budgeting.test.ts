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
      envelopes: [],
      archivedEnvelopes: [],
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
  input: { id: string; currency?: string; initialBalance: number },
): Promise<void> {
  await database.runAsync(
    `INSERT INTO accounts (
      id, name, type, currency, color, icon, initial_balance,
      exclude_from_total, sort_order, created_at, updated_at
    ) VALUES (?, ?, 'checking', ?, '#8B9D83', '🏦', ?, 0, 0, ?, ?)`,
    input.id,
    input.id,
    input.currency ?? "USD",
    input.initialBalance,
    "2026-01-01T00:00:00.000Z",
    "2026-01-01T00:00:00.000Z",
  );
}

async function insertTransaction(
  database: SQLiteDatabase,
  input: {
    id: string;
    type: "income" | "expense" | "transfer";
    amount: number;
    date: string;
    accountId: string;
    toAccountId?: string;
  },
): Promise<void> {
  await database.runAsync(
    `INSERT INTO transactions (
      id, type, amount, currency, date, account_id, to_account_id,
      is_recurring, description, created_at, updated_at
    ) VALUES (?, ?, ?, 'USD', ?, ?, ?, 0, '', ?, ?)`,
    input.id,
    input.type,
    input.amount,
    input.date,
    input.accountId,
    input.toAccountId ?? null,
    `${input.date}T08:00:00.000Z`,
    `${input.date}T08:00:00.000Z`,
  );
}

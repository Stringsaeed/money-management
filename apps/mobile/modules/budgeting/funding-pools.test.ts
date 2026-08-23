import { afterEach, describe, expect, it } from "@jest/globals";
import type { SQLiteDatabase } from "expo-sqlite";

import { createBudgetingCoordinator } from "./budgeting";
import {
  insertBudgetAccount,
  insertBudgetTransaction,
  setupBudgetingDatabase,
} from "./budgeting-test-utils";

const databases: { database: SQLiteDatabase; close: VoidFunction }[] = [];

afterEach(() => databases.splice(0).forEach(({ close }) => close()));

describe("currency Funding Pools", () => {
  it("keeps Funding Pools independent across currency workspaces", async () => {
    const database = await setup();
    await insertBudgetAccount(database, { id: "account-usd", initialBalance: 100_00 });
    await insertBudgetAccount(database, {
      id: "account-aed",
      currency: "AED",
      initialBalance: 500_00,
    });
    await insertBudgetTransaction(database, {
      id: "usd-income",
      type: "income",
      amount: 25_00,
      date: "2026-08-10",
      accountId: "account-usd",
    });
    await insertBudgetTransaction(database, {
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

  it("applies same-currency Funding Boundary Transfers without counting internal transfers", async () => {
    const database = await setup();
    await insertBudgetAccount(database, { id: "account-main", initialBalance: 20_00 });
    await insertBudgetAccount(database, { id: "account-overdrawn", initialBalance: -10_00 });
    await insertBudgetAccount(database, { id: "account-outside", initialBalance: 0 });
    await insertBudgetTransaction(database, {
      id: "internal",
      type: "transfer",
      amount: 5_00,
      date: "2026-08-02",
      accountId: "account-main",
      toAccountId: "account-overdrawn",
    });
    await insertBudgetTransaction(database, {
      id: "entering",
      type: "transfer",
      amount: 3_00,
      date: "2026-08-03",
      accountId: "account-outside",
      toAccountId: "account-main",
    });
    await insertBudgetTransaction(database, {
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

  it("excludes unsupported currency transfers with a resolvable reason", async () => {
    const database = await setup();
    await insertBudgetAccount(database, { id: "account-usd", initialBalance: 100_00 });
    await insertBudgetAccount(database, {
      id: "account-aed",
      currency: "AED",
      initialBalance: 50_00,
    });
    await insertBudgetTransaction(database, {
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

    expect(projection.fundingPool).toEqual({ currency: "USD", amountMinor: 100_00 });
    expect(projection.budgetHealth).toEqual({
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
    });
  });
});

async function setup(): Promise<SQLiteDatabase> {
  const testDatabase = await setupBudgetingDatabase();
  databases.push(testDatabase);
  return testDatabase.database;
}

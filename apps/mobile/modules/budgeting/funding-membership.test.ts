import { afterEach, describe, expect, it } from "@jest/globals";
import type { SQLiteDatabase } from "@/db/sqlite";

import { createBudgetingCoordinator } from "./budgeting";
import {
  insertBudgetAccount,
  insertBudgetTransaction,
  setupBudgetingDatabase,
} from "./budgeting-test-utils";

const databases: { database: SQLiteDatabase; close: VoidFunction }[] = [];

afterEach(() => databases.splice(0).forEach(({ close }) => close()));

describe("Funding Membership", () => {
  it("applies additions to current and future periods without rewriting history", async () => {
    const database = await setup();
    await insertBudgetAccount(database, { id: "account-main", initialBalance: 100_00 });
    await insertBudgetAccount(database, { id: "account-savings", initialBalance: 50_00 });
    await insertBudgetTransaction(database, {
      id: "savings-before-change-period",
      type: "income",
      amount: 20_00,
      date: "2026-07-20",
      accountId: "account-savings",
    });
    await insertBudgetTransaction(database, {
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
    ).resolves.toMatchObject({ fundingPool: { currency: "USD", amountMinor: 100_00 } });
    await expect(
      budgeting.getProjection({ currency: "USD", period: "2026-08" }),
    ).resolves.toMatchObject({ fundingPool: { currency: "USD", amountMinor: 180_00 } });
    await expect(
      budgeting.getProjection({ currency: "USD", period: "2026-09" }),
    ).resolves.toMatchObject({ fundingPool: { currency: "USD", amountMinor: 180_00 } });
  });

  it("applies removals to the current and future periods only", async () => {
    const database = await setup();
    await insertBudgetAccount(database, { id: "account-main", initialBalance: 100_00 });
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
    ).resolves.toMatchObject({ fundingPool: { currency: "USD", amountMinor: 100_00 } });
    await expect(
      budgeting.getProjection({ currency: "USD", period: "2026-09" }),
    ).resolves.toMatchObject({ fundingPool: { currency: "USD", amountMinor: 0 } });
  });

  it("suggests active cash-backed Accounts independently from Home-total visibility", async () => {
    const database = await setup();
    await insertBudgetAccount(database, {
      id: "account-checking",
      initialBalance: 100_00,
      excludeFromTotal: true,
    });
    await insertBudgetAccount(database, {
      id: "account-savings",
      initialBalance: 50_00,
      type: "savings",
    });
    await insertBudgetAccount(database, {
      id: "account-cash",
      initialBalance: 20_00,
      type: "cash",
    });
    await insertBudgetAccount(database, {
      id: "account-card",
      initialBalance: 0,
      type: "credit_card",
    });
    await insertBudgetAccount(database, {
      id: "account-investment",
      initialBalance: 500_00,
      type: "investment",
    });
    await insertBudgetAccount(database, {
      id: "account-other",
      initialBalance: 25_00,
      type: "other",
    });
    await insertBudgetAccount(database, {
      id: "account-archived",
      initialBalance: 0,
      lifecycle: "archived",
    });

    const suggestions = await createBudgetingCoordinator(database).getFundingAccountSuggestions({
      currency: "USD",
    });

    expect(suggestions.filter(({ suggested }) => suggested).map(({ id }) => id)).toEqual([
      "account-cash",
      "account-checking",
      "account-savings",
    ]);
    expect(suggestions.find(({ id }) => id === "account-checking")).toMatchObject({
      excludedFromHomeTotal: true,
      suggested: true,
    });
    expect(suggestions.filter(({ suggested }) => !suggested).map(({ id }) => id)).toEqual([
      "account-card",
      "account-investment",
      "account-other",
    ]);
    expect(suggestions.some(({ id }) => id === "account-archived")).toBe(false);
  });
});

async function setup(): Promise<SQLiteDatabase> {
  const testDatabase = await setupBudgetingDatabase();
  databases.push(testDatabase);
  return testDatabase.database;
}

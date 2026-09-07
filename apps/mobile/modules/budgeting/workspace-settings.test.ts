import { afterEach, describe, expect, it } from "@jest/globals";
import type { SQLiteDatabase } from "@/db/sqlite";

import { createBudgetingCoordinator } from "./budgeting";
import { insertBudgetAccount, setupBudgetingDatabase } from "./budgeting-test-utils";

const databases: { database: SQLiteDatabase; close: VoidFunction }[] = [];

afterEach(() => databases.splice(0).forEach(({ close }) => close()));

describe("currency workspace settings", () => {
  it("uses a deterministic Home Currency fallback and remembers workspace selection", async () => {
    const database = await setup();
    await insertBudgetAccount(database, { id: "account-usd", initialBalance: 100_00 });
    await insertBudgetAccount(database, {
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
});

async function setup(): Promise<SQLiteDatabase> {
  const testDatabase = await setupBudgetingDatabase();
  databases.push(testDatabase);
  return testDatabase.database;
}

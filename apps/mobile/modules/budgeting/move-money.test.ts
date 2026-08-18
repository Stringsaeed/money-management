import { afterEach, describe, expect, it } from "@jest/globals";

import { createBudgetingCoordinator } from "./budgeting";
import { insertBudgetAccount, insertBudgetTransaction } from "./budgeting-test-utils";
import { moveMoneyRequest, setupAssignmentWorkspace } from "./assignment-test-support";
import { closeEnvelopeTestDatabases } from "./envelope-test-support";

afterEach(closeEnvelopeTestDatabases);

describe("Move Money", () => {
  it.each([
    ["Unassigned to Envelope", null, "envelope-one"],
    ["Envelope to Unassigned", "envelope-one", null],
    ["Envelope to Envelope", "envelope-one", "envelope-two"],
  ])("supports %s through one coordinator command", async (_label, source, destination) => {
    const database = await setupAssignmentWorkspace();
    const budgeting = createBudgetingCoordinator(database);
    if (source) {
      await budgeting.moveMoney(moveMoneyRequest({ id: "seed", destinationEnvelopeId: source }));
    }

    const preview = await budgeting.previewMoveMoney(
      moveMoneyRequest({ sourceEnvelopeId: source, destinationEnvelopeId: destination }),
    );
    expect(preview.source.before.amountMinor).toBe(source ? 25_00 : 100_00);
    await budgeting.moveMoney(
      moveMoneyRequest({ sourceEnvelopeId: source, destinationEnvelopeId: destination }),
    );
    const projection = await budgeting.getProjection({ currency: "USD", period: "2026-08" });
    expect(projection?.unassignedMoney.amountMinor).toBe(
      source === null && destination !== null ? 75_00 : destination === null ? 100_00 : 75_00,
    );
  });

  it("rejects invalid or unaffordable amounts without durable changes", async () => {
    const database = await setupAssignmentWorkspace();
    const budgeting = createBudgetingCoordinator(database);
    for (const amountMinor of [0, -1, 12.5, Number.MAX_SAFE_INTEGER + 1, Number.NaN]) {
      await expect(budgeting.moveMoney(moveMoneyRequest({ amountMinor }))).rejects.toThrow(
        /safe integer|positive integer/,
      );
    }
    await expect(budgeting.moveMoney(moveMoneyRequest({ amountMinor: 100_01 }))).rejects.toThrow(
      "source owns",
    );
    await expect(budgeting.moveMoney(moveMoneyRequest({ period: "2026-07" }))).rejects.toThrow(
      "current or a future",
    );
    await expect(
      database.getFirstAsync<{ count: number }>("SELECT COUNT(*) AS count FROM assignments"),
    ).resolves.toEqual({ count: 0 });
  });

  it("reserves future Unassigned Money before allowing another current move", async () => {
    const database = await setupAssignmentWorkspace();
    const budgeting = createBudgetingCoordinator(database);
    await budgeting.moveMoney(
      moveMoneyRequest({ id: "future-assignment", amountMinor: 80_00, period: "2026-09" }),
    );

    await expect(
      budgeting.getProjection({ currency: "USD", period: "2026-08" }),
    ).resolves.toMatchObject({
      unassignedMoney: { amountMinor: 20_00, currency: "USD" },
    });
    await expect(
      budgeting.moveMoney(moveMoneyRequest({ id: "current-assignment", amountMinor: 30_00 })),
    ).rejects.toThrow("source owns");
  });

  it("previews and routes Money through an existing card deficit before availability", async () => {
    const database = await setupAssignmentWorkspace();
    const budgeting = createBudgetingCoordinator(database);
    await insertBudgetAccount(database, {
      id: "account-card",
      initialBalance: 0,
      type: "credit_card",
    });
    await insertBudgetTransaction(database, {
      accountId: "account-card",
      amount: 50_00,
      date: "2026-08-05",
      id: "card-expense",
      type: "expense",
    });
    await database.runAsync(
      "UPDATE transactions SET category_id = ? WHERE id = ?",
      "category-one",
      "card-expense",
    );

    await expect(
      budgeting.previewMoveMoney(moveMoneyRequest({ amountMinor: 70_00 })),
    ).resolves.toMatchObject({
      deficitRouting: {
        cashOverspendingMinor: 0,
        newAvailabilityMinor: 20_00,
        unfundedCardSpendingMinor: 50_00,
      },
    });
    await budgeting.moveMoney(moveMoneyRequest({ amountMinor: 70_00 }));

    const projection = await budgeting.getProjection({ currency: "USD", period: "2026-08" });
    expect(projection?.envelopes.find(({ id }) => id === "envelope-one")).toMatchObject({
      availableMoney: { amountMinor: 20_00, currency: "USD" },
    });
    expect(projection?.unassignedMoney).toEqual({ amountMinor: 30_00, currency: "USD" });
  });
});

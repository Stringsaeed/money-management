import { afterEach, describe, expect, it } from "@jest/globals";

import { createBudgetingCoordinator } from "./budgeting";
import { insertBudgetAccount, insertBudgetTransaction } from "./budgeting-test-utils";
import { moveMoneyRequest, setupAssignmentWorkspace } from "./assignment-test-support";
import { closeEnvelopeTestDatabases } from "./envelope-test-support";

afterEach(closeEnvelopeTestDatabases);

describe("Assignment corrections", () => {
  it("records a reversal chain and exposes three history kinds", async () => {
    const database = await setupAssignmentWorkspace();
    const budgeting = createBudgetingCoordinator(database);
    await budgeting.moveMoney(moveMoneyRequest());
    const correction = {
      ...moveMoneyRequest({
        id: "replacement",
        destinationEnvelopeId: "envelope-two",
        amountMinor: 30_00,
      }),
      originalAssignmentId: "assignment-1",
      reversalId: "reversal-1",
    };
    await expect(budgeting.previewCorrectMoveMoney(correction)).resolves.toMatchObject({
      source: {
        after: { amountMinor: 70_00, currency: "USD" },
        before: { amountMinor: 100_00, currency: "USD" },
      },
    });
    await budgeting.correctMoveMoney(correction);

    await expect(
      budgeting.getAssignmentHistory({ currency: "USD", period: "2026-08" }),
    ).resolves.toEqual([
      expect.objectContaining({ id: "assignment-1", kind: "original" }),
      expect.objectContaining({ id: "reversal-1", kind: "reversal" }),
      expect.objectContaining({ id: "replacement", kind: "replacement" }),
    ]);
  });

  it("rolls back a correction when the replacement cannot persist", async () => {
    const database = await setupAssignmentWorkspace();
    const budgeting = createBudgetingCoordinator(database);
    await budgeting.moveMoney(moveMoneyRequest());
    await database.execAsync(`
      CREATE TRIGGER fail_replacement
      BEFORE INSERT ON assignments
      WHEN NEW.id = 'replacement'
      BEGIN SELECT RAISE(ABORT, 'forced replacement failure'); END;
    `);
    await expect(
      budgeting.correctMoveMoney({
        ...moveMoneyRequest({ id: "replacement" }),
        originalAssignmentId: "assignment-1",
        reversalId: "reversal-1",
      }),
    ).rejects.toThrow("forced replacement failure");
    await expect(
      database.getAllAsync<{ id: string }>("SELECT id FROM assignments ORDER BY id"),
    ).resolves.toEqual([{ id: "assignment-1" }]);
  });

  it("rejects an invalid replacement endpoint without recording correction facts", async () => {
    const database = await setupAssignmentWorkspace();
    const budgeting = createBudgetingCoordinator(database);
    await budgeting.moveMoney(moveMoneyRequest());

    await expect(
      budgeting.correctMoveMoney({
        ...moveMoneyRequest({ id: "replacement", destinationEnvelopeId: "unknown-envelope" }),
        originalAssignmentId: "assignment-1",
        reversalId: "reversal-1",
      }),
    ).rejects.toThrow("unknown Envelope");

    await expect(
      database.getAllAsync<{ id: string }>("SELECT id FROM assignments ORDER BY id"),
    ).resolves.toEqual([{ id: "assignment-1" }]);
  });

  it("does not allow a future replacement while current cash overspending exists", async () => {
    const database = await setupAssignmentWorkspace();
    const budgeting = createBudgetingCoordinator(database);
    await database.runAsync(
      `INSERT INTO assignments (
        id, currency, budget_period, source_envelope_id, destination_envelope_id,
        amount_minor, reverses_assignment_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      "future-original",
      "USD",
      "2026-09",
      null,
      "envelope-one",
      25_00,
      null,
      "2026-08-19T09:00:00.000Z",
    );
    await insertBudgetTransaction(database, {
      accountId: "account-main",
      amount: 10_00,
      date: "2026-08-05",
      id: "cash-expense",
      type: "expense",
    });
    await database.runAsync(
      "UPDATE transactions SET category_id = ? WHERE id = ?",
      "category-two",
      "cash-expense",
    );

    await expect(
      budgeting.correctMoveMoney({
        ...moveMoneyRequest({
          id: "future-replacement",
          destinationEnvelopeId: "envelope-two",
          period: "2026-09",
        }),
        originalAssignmentId: "future-original",
        reversalId: "future-reversal",
      }),
    ).rejects.toThrow("Resolve cash Envelope Overspending");
  });

  it("replays a corrected Assignment into the Card Payment Reserve", async () => {
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
    await budgeting.moveMoney(moveMoneyRequest({ amountMinor: 50_00 }));

    const correction = {
      ...moveMoneyRequest({ id: "replacement", amountMinor: 30_00 }),
      originalAssignmentId: "assignment-1",
      reversalId: "reversal-1",
    };
    await expect(budgeting.previewCorrectMoveMoney(correction)).resolves.toMatchObject({
      destination: {
        before: { amountMinor: 0, currency: "USD" },
        after: { amountMinor: 0, currency: "USD" },
      },
      deficitRouting: { unfundedCardSpendingMinor: 30_00, newAvailabilityMinor: 0 },
    });
    await budgeting.correctMoveMoney(correction);

    await expect(budgeting.getAccountDependencies("account-card", "2026-08")).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "card-payment-reserve", amountMinor: 30_00 }),
        expect.objectContaining({ kind: "unfunded-card-spending", amountMinor: 20_00 }),
      ]),
    );
  });
});

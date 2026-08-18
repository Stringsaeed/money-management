import { afterEach, describe, expect, it } from "@jest/globals";

import { createBudgetingCoordinator } from "./budgeting";
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
});

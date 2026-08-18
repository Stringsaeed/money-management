import { afterEach, describe, expect, it } from "@jest/globals";
import { QueryClient, QueryObserver } from "@tanstack/react-query";

import { createBudgetingCoordinator } from "./budgeting";
import { insertBudgetAccount, insertBudgetTransaction } from "./budgeting-test-utils";
import {
  closeEnvelopeTestDatabases,
  createTestEnvelope,
  insertEnvelopeCategories,
  setupEnvelopeWorkspace,
} from "./envelope-test-support";
import { budgetKeys } from "@/modules/ledger-cache";

afterEach(closeEnvelopeTestDatabases);

async function setupEnvelopes() {
  const database = await setupEnvelopeWorkspace();
  await insertEnvelopeCategories(database, [
    ["category-one", "One"],
    ["category-two", "Two"],
  ]);
  await createTestEnvelope(database, {
    id: "envelope-one",
    name: "One",
    categoryIds: ["category-one"],
  });
  await createTestEnvelope(database, {
    id: "envelope-two",
    name: "Two",
    categoryIds: ["category-two"],
  });
  return database;
}

const request = (overrides: Record<string, unknown> = {}) => ({
  id: "assignment-1",
  currency: "USD",
  period: "2026-08",
  sourceEnvelopeId: null as string | null,
  destinationEnvelopeId: "envelope-one" as string | null,
  amountMinor: 25_00,
  now: "2026-08-19T09:00:00.000Z",
  ...overrides,
});

describe("Move Money assignments", () => {
  it.each([
    ["Unassigned to Envelope", null, "envelope-one"],
    ["Envelope to Unassigned", "envelope-one", null],
    ["Envelope to Envelope", "envelope-one", "envelope-two"],
  ])("supports %s through one coordinator command", async (_label, source, destination) => {
    const database = await setupEnvelopes();
    const budgeting = createBudgetingCoordinator(database);
    if (source) {
      await budgeting.moveMoney(request({ id: "seed", destinationEnvelopeId: source }));
    }

    const preview = await budgeting.previewMoveMoney(
      request({ sourceEnvelopeId: source, destinationEnvelopeId: destination }),
    );
    expect(preview.source.before.amountMinor).toBe(source ? 25_00 : 100_00);
    await budgeting.moveMoney(
      request({ sourceEnvelopeId: source, destinationEnvelopeId: destination }),
    );
    const projection = await budgeting.getProjection({ currency: "USD", period: "2026-08" });
    expect(projection?.unassignedMoney.amountMinor).toBe(
      source === null && destination !== null ? 75_00 : destination === null ? 100_00 : 75_00,
    );
  });

  it("rejects invalid or unaffordable amounts without durable changes", async () => {
    const database = await setupEnvelopes();
    const budgeting = createBudgetingCoordinator(database);
    for (const amountMinor of [0, -1, 12.5, Number.MAX_SAFE_INTEGER + 1, Number.NaN]) {
      await expect(budgeting.moveMoney(request({ amountMinor }))).rejects.toThrow(
        /safe integer|positive integer/,
      );
    }
    await expect(budgeting.moveMoney(request({ amountMinor: 100_01 }))).rejects.toThrow(
      "source owns",
    );
    await expect(budgeting.moveMoney(request({ period: "2026-07" }))).rejects.toThrow(
      "current or a future",
    );
    await expect(
      database.getFirstAsync<{ count: number }>("SELECT COUNT(*) AS count FROM assignments"),
    ).resolves.toEqual({ count: 0 });
  });

  it("reserves future Unassigned Money before allowing another current move", async () => {
    const database = await setupEnvelopes();
    const budgeting = createBudgetingCoordinator(database);

    await budgeting.moveMoney(
      request({ id: "future-assignment", amountMinor: 80_00, period: "2026-09" }),
    );

    await expect(
      budgeting.moveMoney(request({ id: "current-assignment", amountMinor: 30_00 })),
    ).rejects.toThrow("source owns");
    await expect(
      budgeting.getAssignmentHistory({ currency: "USD", period: "2026-08" }),
    ).resolves.toEqual([]);
  });

  it("previews and routes Money through an existing card deficit before availability", async () => {
    const database = await setupEnvelopes();
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
      budgeting.previewMoveMoney(request({ amountMinor: 70_00 })),
    ).resolves.toMatchObject({
      deficitRouting: {
        cashOverspendingMinor: 0,
        newAvailabilityMinor: 20_00,
        unfundedCardSpendingMinor: 50_00,
      },
    });
    await budgeting.moveMoney(request({ amountMinor: 70_00 }));

    const projection = await budgeting.getProjection({ currency: "USD", period: "2026-08" });
    expect(projection?.envelopes.find(({ id }) => id === "envelope-one")).toMatchObject({
      availableMoney: { amountMinor: 20_00, currency: "USD" },
    });
    expect(projection?.unassignedMoney).toEqual({ amountMinor: 30_00, currency: "USD" });
  });

  it("records a reversal chain and exposes three history kinds", async () => {
    const database = await setupEnvelopes();
    const budgeting = createBudgetingCoordinator(database);
    await budgeting.moveMoney(request());
    const correction = {
      ...request({
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
    const database = await setupEnvelopes();
    const budgeting = createBudgetingCoordinator(database);
    await budgeting.moveMoney(request());
    await database.execAsync(`
      CREATE TRIGGER fail_replacement
      BEFORE INSERT ON assignments
      WHEN NEW.id = 'replacement'
      BEGIN SELECT RAISE(ABORT, 'forced replacement failure'); END;
    `);
    await expect(
      budgeting.correctMoveMoney({
        ...request({ id: "replacement" }),
        originalAssignmentId: "assignment-1",
        reversalId: "reversal-1",
      }),
    ).rejects.toThrow("forced replacement failure");
    await expect(
      database.getAllAsync<{ id: string }>("SELECT id FROM assignments ORDER BY id"),
    ).resolves.toEqual([{ id: "assignment-1" }]);
  });

  it("keeps a committed move successful when projection refresh fails", async () => {
    const database = await setupEnvelopes();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });
    const queryKey = budgetKeys.projection("USD", "2026-08");
    const refreshError = new Error("projection refresh failed");
    const queryFn = jest.fn().mockResolvedValueOnce(null).mockRejectedValueOnce(refreshError);
    const observer = new QueryObserver(queryClient, { queryFn, queryKey, staleTime: Infinity });
    await queryClient.fetchQuery({ queryFn, queryKey, staleTime: Infinity });
    const unsubscribe = observer.subscribe(() => undefined);
    const budgeting = createBudgetingCoordinator(database, { queryClient });

    await expect(budgeting.moveMoney(request())).resolves.toMatchObject({ currency: "USD" });
    await expect(
      budgeting.getAssignmentHistory({ currency: "USD", period: "2026-08" }),
    ).resolves.toEqual([expect.objectContaining({ id: "assignment-1" })]);
    expect(queryClient.getQueryState(queryKey)).toMatchObject({
      error: refreshError,
      status: "error",
    });

    unsubscribe();
    queryClient.clear();
  });
});

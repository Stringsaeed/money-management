import { afterEach, describe, expect, it } from "@jest/globals";
import { QueryClient, QueryObserver } from "@tanstack/react-query";

import { budgetKeys } from "@/modules/ledger-cache";

import { createBudgetingCoordinator } from "./budgeting";
import { moveMoneyRequest, setupAssignmentWorkspace } from "./assignment-test-support";
import { closeEnvelopeTestDatabases } from "./envelope-test-support";

afterEach(closeEnvelopeTestDatabases);

describe("Assignment cache effects", () => {
  it("keeps a committed move successful when projection refresh fails", async () => {
    const database = await setupAssignmentWorkspace();
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

    await expect(budgeting.moveMoney(moveMoneyRequest())).resolves.toMatchObject({
      currency: "USD",
    });
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

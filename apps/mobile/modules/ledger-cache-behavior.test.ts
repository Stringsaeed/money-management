import { QueryClient, QueryObserver, type QueryKey } from "@tanstack/react-query";

import {
  budgetKeys,
  cohereLedgerCache,
  cohereRecurringEffects,
  recurringRuleKeys,
  transactionKeys,
} from "./ledger-cache";

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
      },
    },
  });

const invalidatedKeys = (invalidateQueries: jest.Mock) =>
  invalidateQueries.mock.calls.map(([filters]) => filters?.queryKey as QueryKey | undefined);

describe("ledger cache coherence behavior", () => {
  it("deduplicates affected keys and waits for every invalidation", async () => {
    const resolvers: (() => void)[] = [];
    const invalidateQueries = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolvers.push(resolve);
        }),
    );
    const queryClient = { invalidateQueries } as unknown as QueryClient;
    let coherenceResolved = false;

    const coherence = cohereRecurringEffects(queryClient, [
      "ledger",
      "ledger",
      "summaries",
      "summaries",
    ]).then(() => {
      coherenceResolved = true;
    });
    await Promise.resolve();

    expect(invalidatedKeys(invalidateQueries)).toEqual([
      ["transactions"],
      ["budgeting", "projections"],
      ["month-summary"],
      ["transaction-date-range"],
    ]);
    expect(coherenceResolved).toBe(false);

    resolvers[0]();
    resolvers[1]();
    await Promise.resolve();
    expect(coherenceResolved).toBe(false);

    resolvers[2]();
    await Promise.resolve();
    expect(coherenceResolved).toBe(false);

    resolvers[3]();
    await coherence;
    expect(coherenceResolved).toBe(true);
  });

  it("refetches an active upcoming query once when parent and child keys are affected", async () => {
    const queryClient = createQueryClient();
    const queryFn = jest.fn().mockResolvedValue("upcoming");
    const queryKey = recurringRuleKeys.upcoming(3);
    const options = { queryKey, queryFn, staleTime: Infinity };
    await queryClient.fetchQuery(options);
    const observer = new QueryObserver(queryClient, options);
    const unsubscribe = observer.subscribe(() => undefined);
    queryFn.mockClear();

    await cohereRecurringEffects(queryClient, ["rules", "upcoming"]);

    expect(queryFn).toHaveBeenCalledTimes(1);
    unsubscribe();
    queryClient.clear();
  });

  it("waits for an active affected query to finish refetching", async () => {
    const queryClient = createQueryClient();
    let finishRefetch!: (value: string) => void;
    const refetch = new Promise<string>((resolve) => {
      finishRefetch = resolve;
    });
    const queryFn = jest.fn().mockResolvedValueOnce("before").mockReturnValueOnce(refetch);
    const queryKey = transactionKeys.list({});
    const options = { queryKey, queryFn, staleTime: Infinity };
    await queryClient.fetchQuery(options);
    const observer = new QueryObserver(queryClient, options);
    const unsubscribe = observer.subscribe(() => undefined);
    let coherenceResolved = false;

    const coherence = cohereLedgerCache(queryClient, {
      kind: "transaction.created",
      id: "transaction-1",
    }).then(() => {
      coherenceResolved = true;
    });
    await Promise.resolve();

    expect(queryFn).toHaveBeenCalledTimes(2);
    expect(coherenceResolved).toBe(false);

    finishRefetch("after");
    await coherence;

    expect(queryClient.getQueryData(queryKey)).toBe("after");
    unsubscribe();
    queryClient.clear();
  });

  it("marks an inactive affected query stale without fetching it", async () => {
    const queryClient = createQueryClient();
    const queryFn = jest.fn().mockResolvedValue("cached");
    const queryKey = transactionKeys.list({});
    await queryClient.fetchQuery({ queryKey, queryFn, staleTime: Infinity });
    queryFn.mockClear();

    await cohereLedgerCache(queryClient, {
      kind: "transaction.updated",
      id: "transaction-1",
    });

    expect(queryFn).not.toHaveBeenCalled();
    expect(queryClient.getQueryState(queryKey)?.isInvalidated).toBe(true);
    queryClient.clear();
  });

  it("keeps a failed active refetch as query state without rejecting coherence", async () => {
    const queryClient = createQueryClient();
    const refetchError = new Error("refresh failed");
    const queryFn = jest.fn().mockResolvedValueOnce("before").mockRejectedValueOnce(refetchError);
    const queryKey = transactionKeys.list({});
    const options = { queryKey, queryFn, staleTime: Infinity };
    await queryClient.fetchQuery(options);
    const observer = new QueryObserver(queryClient, options);
    const unsubscribe = observer.subscribe(() => undefined);

    await expect(
      cohereLedgerCache(queryClient, {
        kind: "transaction.deleted",
        id: "transaction-1",
      }),
    ).resolves.toBeUndefined();

    expect(queryClient.getQueryState(queryKey)).toMatchObject({
      error: refetchError,
      status: "error",
    });
    unsubscribe();
    queryClient.clear();
  });

  it("keeps a failed budget refresh visible after a committed Category archive", async () => {
    const queryClient = createQueryClient();
    const refetchError = new Error("projection refresh failed");
    const queryFn = jest.fn().mockResolvedValueOnce("before").mockRejectedValueOnce(refetchError);
    const queryKey = budgetKeys.projection("USD", "2026-08");
    const options = { queryKey, queryFn, staleTime: Infinity };
    await queryClient.fetchQuery(options);
    const observer = new QueryObserver(queryClient, options);
    const unsubscribe = observer.subscribe(() => undefined);

    await expect(
      cohereLedgerCache(queryClient, {
        kind: "category.archived",
        id: "category-1",
      }),
    ).resolves.toBeUndefined();

    expect(queryClient.getQueryState(queryKey)).toMatchObject({
      error: refetchError,
      status: "error",
    });
    unsubscribe();
    queryClient.clear();
  });
});

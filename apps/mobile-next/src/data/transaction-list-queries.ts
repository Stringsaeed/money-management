import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";

import type { V2Transaction, V2TransactionSummary } from "@trove/api/v2/contracts";

import { ledgerClient, type TransactionListFilters } from "./ledger-client";
import { useLedgerData } from "./ledger-queries";
import { normalizeTransactionFilters, transactionListKey } from "./transaction-list-keys";

export const TRANSACTION_PAGE_SIZE = 50;

export interface TransactionPagesResult {
  readonly data: readonly V2Transaction[];
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly isRefreshing: boolean;
  /** Rows belong to the previous filter while the new one loads. */
  readonly isStale: boolean;
  readonly hasNextPage: boolean;
  readonly isFetchingNextPage: boolean;
  readonly nextPageFailed: boolean;
  readonly loadMore: () => void;
  readonly refresh: () => Promise<void>;
}

const FIRST_PAGE: string | null = null;

/** Newest-first Transactions filtered and paged by the server, one page per `loadMore`. */
export function useTransactionPagesQuery(filters: TransactionListFilters): TransactionPagesResult {
  const { identityKey, scope } = useLedgerData();
  const normalized = normalizeTransactionFilters(filters);
  const query = useInfiniteQuery({
    queryKey: [...transactionListKey(identityKey, scope), "pages", normalized],
    queryFn: ({ pageParam }) =>
      ledgerClient.transactions.list(scope, {
        ...normalized,
        limit: TRANSACTION_PAGE_SIZE,
        cursor: pageParam,
      }),
    initialPageParam: FIRST_PAGE,
    getNextPageParam: (page) => page.nextCursor,
    // Keep the current rows on screen while a changed filter loads, instead of blanking.
    placeholderData: keepPreviousData,
    staleTime: 15_000,
    retry: 1,
  });
  const hasData = (query.data?.pages.length ?? 0) > 0;
  return {
    data: query.data?.pages.flatMap((page) => page.items) ?? [],
    isLoading: query.isLoading,
    // A failed follow-up page keeps the rows already shown; only an empty list is an error.
    isError: query.isError && !hasData,
    isRefreshing: query.isRefetching && !query.isFetchingNextPage && !query.isPlaceholderData,
    isStale: query.isPlaceholderData,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    nextPageFailed: query.isFetchNextPageError,
    loadMore: () => {
      if (query.hasNextPage && !query.isFetching) void query.fetchNextPage();
    },
    refresh: async () => {
      await query.refetch();
    },
  };
}

export interface TransactionSummaryResult {
  readonly data: V2TransactionSummary | undefined;
  readonly isLoading: boolean;
  readonly isError: boolean;
}

/** Count and per-currency totals for every Transaction matching `filters`, not just loaded pages. */
export function useTransactionSummaryQuery(
  filters: TransactionListFilters,
): TransactionSummaryResult {
  const { identityKey, scope } = useLedgerData();
  const normalized = normalizeTransactionFilters(filters);
  const query = useQuery({
    queryKey: [...transactionListKey(identityKey, scope), "summary", normalized],
    queryFn: () => ledgerClient.transactions.summary(scope, normalized),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
    retry: 1,
  });
  return { data: query.data, isLoading: query.isLoading, isError: query.isError };
}

export interface TransactionItemResult {
  readonly data: V2Transaction | undefined;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly error: Error | null;
  readonly retry: () => Promise<void>;
}

/** One Transaction by id, independent of which list pages happen to be loaded. */
export function useTransactionQuery(id: string | undefined): TransactionItemResult {
  const { identityKey, scope } = useLedgerData();
  const query = useQuery({
    queryKey: [...transactionListKey(identityKey, scope), "item", id],
    queryFn: () => ledgerClient.transactions.get(scope, id ?? ""),
    enabled: Boolean(id),
    staleTime: 15_000,
    retry: 1,
  });
  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    retry: async () => {
      await query.refetch();
    },
  };
}

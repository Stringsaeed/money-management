import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useTransactionDataSource } from "@/modules/ledger-data-source/coordinator";
import type { NewCardPayment, NewRefund } from "@/modules/ledger-data-source/contract";
import {
  cohereLedgerCache,
  monthSummaryKeys,
  transactionDateRangeKeys,
  transactionKeys,
  type TransactionQueryFilters,
} from "@/modules/ledger-cache";
import type { Transaction } from "@/types";

type TransactionFilters = TransactionQueryFilters;

// ── Queries ────────────────────────────────────────────────────────────────────

export function useTransactions(filters: TransactionFilters) {
  const source = useTransactionDataSource();
  const query = useQuery({
    queryKey: [...transactionKeys.list(filters), source.cacheKey],
    queryFn: () => source.transactions.list(filters),
  });
  return { ...query, source: source.source };
}

export function useTransaction(id: string | undefined) {
  const source = useTransactionDataSource();
  const query = useQuery({
    queryKey: [...transactionKeys.detail(id ?? ""), source.cacheKey],
    queryFn: () => source.transactions.get(id!),
    enabled: !!id,
  });
  return { ...query, source: source.source };
}

// ── Transaction date range ────────────────────────────────────────────────────

export function useTransactionDateRange() {
  const source = useTransactionDataSource();
  const query = useQuery({
    queryKey: [...transactionDateRangeKeys.all, source.cacheKey],
    queryFn: source.transactions.dateRange,
  });
  return { ...query, source: source.source };
}

export function useTransactionPage(
  options: { limit?: number; beforeDate?: string; beforeId?: string } = {},
) {
  const source = useTransactionDataSource();
  const limit = options.limit ?? 100;
  const query = useQuery({
    queryKey: [
      ...transactionKeys.page(limit, options.beforeDate, options.beforeId),
      source.cacheKey,
    ],
    queryFn: () =>
      source.transactions.page({
        limit,
        beforeDate: options.beforeDate,
        beforeId: options.beforeId,
      }),
  });
  return { ...query, source: source.source };
}

// ── Month summary ─────────────────────────────────────────────────────────────

export function useMonthSummary(
  year: number,
  month: number,
  accountId?: string | null,
  enabled = true,
) {
  const source = useTransactionDataSource();
  const query = useQuery({
    queryKey: [...monthSummaryKeys.detail(year, month, accountId), source.cacheKey],
    enabled,
    queryFn: () => source.transactions.monthSummary(year, month, accountId),
  });
  return { ...query, source: source.source };
}

// ── Mutations ──────────────────────────────────────────────────────────────────

type NewTransaction = Omit<Transaction, "id" | "createdAt" | "updatedAt" | "isRecurring"> & {
  isRecurring?: boolean;
};

export function useCreateTransaction() {
  const source = useTransactionDataSource();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (data: NewTransaction) => source.transactions.create(data),
    onSuccess: (id) => cohereLedgerCache(queryClient, { kind: "transaction.created", id }),
  });
  return { ...mutation, source: source.source };
}

export function useUpdateTransaction() {
  const source = useTransactionDataSource();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Omit<Transaction, "id" | "createdAt" | "date"> & { date?: Date | string }>;
    }) => source.transactions.update(id, data),
    onSuccess: (_, { id }) => cohereLedgerCache(queryClient, { kind: "transaction.updated", id }),
  });
  return { ...mutation, source: source.source };
}

export function useDeleteTransaction() {
  const source = useTransactionDataSource();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: source.transactions.delete,
    onSuccess: (_, id) => cohereLedgerCache(queryClient, { kind: "transaction.deleted", id }),
  });
  return { ...mutation, source: source.source };
}

export function useRecordCardPayment() {
  const source = useTransactionDataSource();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (data: NewCardPayment) => source.transactions.recordCardPayment(data),
    onSuccess: (id) => cohereLedgerCache(queryClient, { kind: "transaction.created", id }),
  });
  return { ...mutation, source: source.source };
}

export function useLinkRefund() {
  const source = useTransactionDataSource();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (data: NewRefund) => source.transactions.linkRefund(data),
    onSuccess: (id) => cohereLedgerCache(queryClient, { kind: "transaction.created", id }),
  });
  return { ...mutation, source: source.source };
}

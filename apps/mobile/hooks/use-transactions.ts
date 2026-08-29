import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useLocalTransactionDataSource } from "@/modules/ledger-data-source/local";
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
  const source = useLocalTransactionDataSource();
  const query = useQuery({
    queryKey: [...transactionKeys.list(filters), source.cacheKey],
    queryFn: () => source.reads.transactions.transactions(filters),
  });
  return { ...query, source: source.source };
}

export function useTransaction(id: string | undefined) {
  const source = useLocalTransactionDataSource();
  const query = useQuery({
    queryKey: [...transactionKeys.detail(id ?? ""), source.cacheKey],
    queryFn: () => source.reads.transactions.transaction(id!),
    enabled: !!id,
  });
  return { ...query, source: source.source };
}

// ── Transaction date range ────────────────────────────────────────────────────

export function useTransactionDateRange() {
  const source = useLocalTransactionDataSource();
  const query = useQuery({
    queryKey: [...transactionDateRangeKeys.all, source.cacheKey],
    queryFn: source.reads.transactions.dateRange,
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
  const source = useLocalTransactionDataSource();
  const query = useQuery({
    queryKey: [...monthSummaryKeys.detail(year, month, accountId), source.cacheKey],
    enabled,
    queryFn: () => source.reads.transactions.monthSummary(year, month, accountId),
  });
  return { ...query, source: source.source };
}

// ── Mutations ──────────────────────────────────────────────────────────────────

type NewTransaction = Omit<Transaction, "id" | "createdAt" | "updatedAt" | "isRecurring"> & {
  isRecurring?: boolean;
};

export function useCreateTransaction() {
  const source = useLocalTransactionDataSource();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (data: NewTransaction) => source.mutations.transactions.createTransaction(data),
    onSuccess: (id) => cohereLedgerCache(queryClient, { kind: "transaction.created", id }),
  });
  return { ...mutation, source: source.source };
}

export function useUpdateTransaction() {
  const source = useLocalTransactionDataSource();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Omit<Transaction, "id" | "createdAt" | "date"> & { date?: Date | string }>;
    }) => source.mutations.transactions.updateTransaction(id, data),
    onSuccess: (_, { id }) => cohereLedgerCache(queryClient, { kind: "transaction.updated", id }),
  });
  return { ...mutation, source: source.source };
}

export function useDeleteTransaction() {
  const source = useLocalTransactionDataSource();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: source.mutations.transactions.deleteTransaction,
    onSuccess: (_, id) => cohereLedgerCache(queryClient, { kind: "transaction.deleted", id }),
  });
  return { ...mutation, source: source.source };
}

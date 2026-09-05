import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";

import { useTransactionDataSource } from "@/modules/ledger-data-source/coordinator";
import type { NewCardPayment, NewRefund } from "@/modules/ledger-data-source/contract";
import {
  applyLedgerFilters,
  dateRangeOf,
  pageTransactions,
  queryFiltersToLedger,
  summarizeTransactions,
} from "@/modules/ledger-db/filters";
import type { SyncedTransactionLedger } from "@/modules/ledger-db/ledger";
import { useSyncedTransactionLedger } from "@/modules/ledger-db/provider";
import {
  cohereLedgerCache,
  monthSummaryKeys,
  transactionDateRangeKeys,
  transactionKeys,
  type TransactionQueryFilters,
} from "@/modules/ledger-cache";
import type { Transaction } from "@/types";

type TransactionFilters = TransactionQueryFilters;

const ignoreListener = () => undefined;
const emptySubscribe = () => ignoreListener;
const zeroRevision = () => 0;

const useLedgerRevision = (ledger: SyncedTransactionLedger | null) =>
  useSyncExternalStore(
    ledger ? ledger.subscribe : emptySubscribe,
    ledger ? ledger.revision : zeroRevision,
    ledger ? ledger.revision : zeroRevision,
  );

// ── Queries ────────────────────────────────────────────────────────────────────

export function useTransactions(filters: TransactionFilters) {
  const source = useTransactionDataSource();
  const ledger = useSyncedTransactionLedger();
  useLedgerRevision(ledger);
  const query = useQuery({
    queryKey: [...transactionKeys.list(filters), source.cacheKey],
    queryFn: () => source.transactions.list(filters),
    enabled: !ledger,
  });
  if (ledger) {
    const status = ledger.status();
    return {
      ...query,
      data: applyLedgerFilters(ledger.rows(), queryFiltersToLedger(filters)),
      isLoading: status.phase === "hydrating",
      isPending: status.phase === "hydrating",
      isError: status.phase === "unavailable",
      isSuccess: status.phase === "ready",
      source: "synced" as const,
      refetch: ledger.refresh,
    };
  }
  return { ...query, source: source.source };
}

export function useTransaction(id: string | undefined) {
  const source = useTransactionDataSource();
  const ledger = useSyncedTransactionLedger();
  useLedgerRevision(ledger);
  const query = useQuery({
    queryKey: [...transactionKeys.detail(id ?? ""), source.cacheKey],
    queryFn: () => source.transactions.get(id!),
    enabled: !ledger && !!id,
  });
  if (ledger) {
    const status = ledger.status();
    return {
      ...query,
      data: id ? ledger.rows().find((row) => row.id === id) : undefined,
      isLoading: status.phase === "hydrating",
      isPending: status.phase === "hydrating",
      isError: status.phase === "unavailable",
      isSuccess: status.phase === "ready",
      source: "synced" as const,
      refetch: ledger.refresh,
    };
  }
  return { ...query, source: source.source };
}

// ── Transaction date range ────────────────────────────────────────────────────

export function useTransactionDateRange() {
  const source = useTransactionDataSource();
  const ledger = useSyncedTransactionLedger();
  useLedgerRevision(ledger);
  const query = useQuery({
    queryKey: [...transactionDateRangeKeys.all, source.cacheKey],
    queryFn: source.transactions.dateRange,
    enabled: !ledger,
  });
  if (ledger) {
    const status = ledger.status();
    return {
      ...query,
      data: dateRangeOf(ledger.rows()),
      isLoading: status.phase === "hydrating",
      isPending: status.phase === "hydrating",
      isError: status.phase === "unavailable",
      isSuccess: status.phase === "ready",
      source: "synced" as const,
      refetch: ledger.refresh,
    };
  }
  return { ...query, source: source.source };
}

export function useTransactionPage(
  options: { limit?: number; beforeDate?: string; beforeId?: string } = {},
) {
  const source = useTransactionDataSource();
  const ledger = useSyncedTransactionLedger();
  useLedgerRevision(ledger);
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
    enabled: !ledger,
  });
  if (ledger) {
    const status = ledger.status();
    return {
      ...query,
      data: pageTransactions(ledger.rows(), {
        limit,
        beforeDate: options.beforeDate,
        beforeId: options.beforeId,
      }),
      isLoading: status.phase === "hydrating",
      isPending: status.phase === "hydrating",
      isError: status.phase === "unavailable",
      isSuccess: status.phase === "ready",
      source: "synced" as const,
      refetch: ledger.refresh,
    };
  }
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
  const ledger = useSyncedTransactionLedger();
  useLedgerRevision(ledger);
  const query = useQuery({
    queryKey: [...monthSummaryKeys.detail(year, month, accountId), source.cacheKey],
    enabled: enabled && !ledger,
    queryFn: () => source.transactions.monthSummary(year, month, accountId),
  });
  if (ledger) {
    const status = ledger.status();
    return {
      ...query,
      data: summarizeTransactions(
        applyLedgerFilters(ledger.rows(), queryFiltersToLedger({ year, month, accountId })),
      ),
      isLoading: status.phase === "hydrating",
      isPending: status.phase === "hydrating",
      isError: status.phase === "unavailable",
      isSuccess: status.phase === "ready",
      source: "synced" as const,
      refetch: ledger.refresh,
    };
  }
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

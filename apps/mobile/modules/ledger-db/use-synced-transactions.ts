import { useSyncExternalStore } from "react";

import { applyLedgerFilters, dateRangeOf, summarizeTransactions } from "./filters";
import type { SyncedTransactionLedger } from "./ledger";
import { useRequiredLedger } from "./provider";
import type { LedgerDateRange, LedgerStatus, LedgerTransaction, TransactionFilters } from "./types";

export interface TransactionListView {
  readonly rows: readonly LedgerTransaction[];
  readonly status: LedgerStatus;
}

export interface TransactionDetailView {
  readonly row: LedgerTransaction | undefined;
  readonly status: LedgerStatus;
}

export interface TransactionTotalsView {
  readonly totals: { income: number; expense: number; net: number };
  readonly status: LedgerStatus;
}

export interface TransactionDateRangeView {
  readonly range: LedgerDateRange;
  readonly status: LedgerStatus;
}

export const useSyncedTransactions = (filters?: TransactionFilters): TransactionListView => {
  const ledger = useRequiredLedger();
  useLedgerRevision(ledger);
  return {
    rows: applyLedgerFilters(ledger.rows(), filters),
    status: ledger.status(),
  };
};

export const useSyncedTransaction = (id: string | undefined): TransactionDetailView => {
  const ledger = useRequiredLedger();
  useLedgerRevision(ledger);
  const rows = ledger.rows();
  return {
    row: id ? rows.find((row) => row.id === id) : undefined,
    status: ledger.status(),
  };
};

export const useSyncedTransactionTotals = (filters?: TransactionFilters): TransactionTotalsView => {
  const { rows, status } = useSyncedTransactions(filters);
  const summary = summarizeTransactions(rows);
  return {
    totals: { income: summary.totalIncome, expense: summary.totalExpense, net: summary.netAmount },
    status,
  };
};

export const useSyncedTransactionDateRange = (): TransactionDateRangeView => {
  const ledger = useRequiredLedger();
  useLedgerRevision(ledger);
  return { range: dateRangeOf(ledger.rows()), status: ledger.status() };
};

const useLedgerRevision = (ledger: SyncedTransactionLedger) =>
  useSyncExternalStore(ledger.subscribe, ledger.revision, ledger.revision);

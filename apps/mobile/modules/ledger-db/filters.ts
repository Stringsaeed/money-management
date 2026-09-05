import type { TransactionQueryFilters } from "@/modules/ledger-cache";
import type { TransactionWithDetails } from "@/types";
import { toDateString } from "@/utils/date";

import { monthFilter, type LedgerTransaction, type TransactionFilters } from "./types";

export interface TransactionPage {
  readonly transactions: LedgerTransaction[];
  readonly hasMore: boolean;
  readonly nextCursor: { date: string; id: string } | null;
}

export interface LedgerDateBounds {
  readonly minDate: string | null;
  readonly maxDate: string | null;
}

export const queryFiltersToLedger = (filters: TransactionQueryFilters): TransactionFilters => {
  const month = monthFromQuery(filters);
  const from = latestDate(month.from, filters.startsOnOrAfter);
  return {
    ...(from && { from }),
    ...(month.to && { to: month.to }),
    ...optionalFilterFields(filters),
  };
};

export const applyLedgerFilters = (
  rows: readonly LedgerTransaction[],
  filters: TransactionFilters = {},
): LedgerTransaction[] => {
  const matched = rows.filter((row) => matchesFilters(row, filters));
  matched.sort((left, right) => compareRows(left, right, filters.sort ?? "desc"));
  return filters.limit ? matched.slice(0, filters.limit) : matched;
};

export const pageTransactions = (
  rows: readonly LedgerTransaction[],
  options: { limit: number; beforeDate?: string; beforeId?: string },
): TransactionPage => {
  const remaining = applyLedgerFilters(rows, { sort: "desc" }).filter((transaction) =>
    isBeforeCursor(transaction, options.beforeDate, options.beforeId),
  );
  const page = remaining.slice(0, options.limit);
  const last = page.at(-1);
  return {
    transactions: page,
    hasMore: remaining.length > options.limit,
    nextCursor: remaining.length > options.limit && last ? { date: last.date, id: last.id } : null,
  };
};

export const summarizeTransactions = (rows: readonly TransactionWithDetails[]) => {
  let totalIncome = 0;
  let totalExpense = 0;
  for (const transaction of rows) {
    if (transaction.type === "income") totalIncome += transaction.amount;
    else if (transaction.type === "expense") totalExpense += transaction.amount;
  }
  return { totalIncome, totalExpense, netAmount: totalIncome - totalExpense };
};

export const dateRangeOf = (rows: readonly LedgerTransaction[]): LedgerDateBounds => {
  const sorted = applyLedgerFilters(rows, { sort: "asc" });
  return { minDate: sorted[0]?.date ?? null, maxDate: sorted.at(-1)?.date ?? null };
};

export const toEditDate = (date: Date | string | undefined): string | undefined => {
  if (date === undefined) return undefined;
  return date instanceof Date ? toDateString(date) : date;
};

const monthFromQuery = (filters: TransactionQueryFilters): TransactionFilters =>
  filters.year !== undefined && filters.month !== undefined
    ? monthFilter(filters.year, filters.month)
    : {};

const latestDate = (...candidates: (string | undefined)[]): string | undefined => {
  const dates = candidates.filter((value): value is string => Boolean(value));
  if (dates.length === 0) return undefined;
  return dates.reduce((left, right) => (left > right ? left : right));
};

const optionalFilterFields = (filters: TransactionQueryFilters): TransactionFilters => ({
  ...(filters.accountId && { accountId: filters.accountId }),
  ...(filters.categoryId && { categoryId: filters.categoryId }),
  ...(filters.type && { type: filters.type }),
  ...(filters.isRecurring !== undefined && { isRecurring: filters.isRecurring }),
  ...(filters.sort && { sort: filters.sort }),
  ...(filters.limit !== undefined && { limit: filters.limit }),
});

const matchesAccount = (row: LedgerTransaction, accountId: string): boolean =>
  row.accountId === accountId || row.toAccountId === accountId;

const matchesDate = (row: LedgerTransaction, filters: TransactionFilters): boolean =>
  !(filters.from && row.date < filters.from) && !(filters.to && row.date > filters.to);

const matchesFields = (row: LedgerTransaction, filters: TransactionFilters): boolean =>
  !(filters.accountId && !matchesAccount(row, filters.accountId)) &&
  !(filters.categoryId && row.categoryId !== filters.categoryId) &&
  !(filters.type && row.type !== filters.type) &&
  !(filters.isRecurring !== undefined && row.isRecurring !== filters.isRecurring);

const matchesFilters = (row: LedgerTransaction, filters: TransactionFilters): boolean =>
  matchesDate(row, filters) && matchesFields(row, filters);

const isBeforeCursor = (
  transaction: LedgerTransaction,
  beforeDate?: string,
  beforeId?: string,
): boolean => {
  if (!beforeDate) return true;
  if (transaction.date < beforeDate) return true;
  return transaction.date === beforeDate && Boolean(beforeId && transaction.id < beforeId);
};

const compareRows = (
  left: LedgerTransaction,
  right: LedgerTransaction,
  sort: "asc" | "desc",
): number => {
  const dateOrder = left.date.localeCompare(right.date);
  if (dateOrder !== 0) return sort === "asc" ? dateOrder : -dateOrder;
  return right.id.localeCompare(left.id);
};

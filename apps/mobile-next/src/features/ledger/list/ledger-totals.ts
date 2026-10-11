import { endOfMonth, format, isSameMonth, isSameYear, startOfMonth } from "date-fns";

import type { V2TransactionCurrencyTotal, V2TransactionSummary } from "@trove/api/v2/contracts";

import { parseDateKey } from "@/utils/date";

export interface LedgerTotalsPeriod {
  readonly from: string;
  readonly to: string;
  /** Stamp after IN and OUT: `OCT`, `AUG–OCT`, `NOV 25–OCT 26`. */
  readonly label: string;
}

const month = (date: Date) => format(date, "MMM").toUpperCase();
const monthYear = (date: Date) => format(date, "MMM yy").toUpperCase();

export function periodLabel(from: Date, to: Date): string {
  if (isSameMonth(from, to)) return month(from);
  if (isSameYear(from, to)) return `${month(from)}–${month(to)}`;
  return `${monthYear(from)}–${monthYear(to)}`;
}

/**
 * The window the IN and OUT card counts: the date filter when one is applied, otherwise the
 * calendar month holding `today`.
 */
export function totalsPeriod(
  range: { readonly from: string; readonly to: string } | null,
  today: Date,
): LedgerTotalsPeriod {
  const from = range ? parseDateKey(range.from) : null;
  const to = range ? parseDateKey(range.to) : null;
  if (range && from && to) return { from: range.from, to: range.to, label: periodLabel(from, to) };
  return {
    from: format(startOfMonth(today), "yyyy-MM-dd"),
    to: format(endOfMonth(today), "yyyy-MM-dd"),
    label: month(today),
  };
}

export interface LedgerTotals {
  readonly currency: string;
  readonly incomeMinor: number;
  readonly expenseMinor: number;
  /** More than one currency was counted; the card names the one it shows. */
  readonly mixed: boolean;
}

/** The currency with the most entries in the period, or `null` before anything is logged. */
export function primaryTotals(summary: V2TransactionSummary | undefined): LedgerTotals | null {
  const totals = summary?.totals ?? [];
  const top = totals.reduce<V2TransactionCurrencyTotal | null>(
    (best, total) => (best === null || total.count > best.count ? total : best),
    null,
  );
  if (!top) return null;
  return {
    currency: top.currency,
    incomeMinor: top.incomeMinor,
    expenseMinor: top.expenseMinor,
    mixed: totals.length > 1,
  };
}

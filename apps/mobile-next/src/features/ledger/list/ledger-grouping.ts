import { differenceInCalendarDays, format, isSameYear } from "date-fns";

import type { V2Transaction } from "@trove/api/v2/contracts";

import { parseDateKey } from "@/utils/date";

export interface LedgerSectionHeader {
  readonly type: "header";
  readonly key: string;
  readonly title: string;
  /**
   * Net of the section when it is fully loaded and single-currency. The trailing section of a
   * list with more pages is still partial, so it carries no net rather than a misleading one.
   */
  readonly net: { readonly minor: number; readonly currency: string } | null;
  readonly count: number;
}

export interface LedgerRowItem {
  readonly type: "row";
  readonly key: string;
  readonly transaction: V2Transaction;
  readonly lastInSection: boolean;
}

export type LedgerListItem = LedgerSectionHeader | LedgerRowItem;

export type LedgerGrouping = "day" | "month";

export function dayTitle(date: string, today: Date): string {
  const parsed = parseDateKey(date);
  if (!parsed) return date;
  const days = differenceInCalendarDays(today, parsed);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return format(parsed, isSameYear(parsed, today) ? "EEEE, d MMMM" : "EEE, d MMM yyyy");
}

function monthTitle(date: string): string {
  const parsed = parseDateKey(date);
  return parsed ? format(parsed, "MMMM yyyy") : date.slice(0, 7);
}

const signed = (transaction: V2Transaction): number =>
  transaction.kind === "income"
    ? transaction.amountMinor
    : transaction.kind === "expense"
      ? -transaction.amountMinor
      : 0;

function sectionNet(rows: readonly V2Transaction[]): LedgerSectionHeader["net"] {
  const currency = rows[0]?.currency;
  if (!currency || rows.some((row) => row.currency !== currency)) return null;
  return { currency, minor: rows.reduce((sum, row) => sum + signed(row), 0) };
}

/**
 * Splits newest-first Transactions into dated sections with a header before each group.
 * Input order is preserved, so appending a page only extends or adds trailing sections.
 */
export function groupTransactions(
  transactions: readonly V2Transaction[],
  grouping: LedgerGrouping,
  today: Date,
  hasMore = false,
): LedgerListItem[] {
  const sectionKey = (row: V2Transaction) => (grouping === "day" ? row.date : row.date.slice(0, 7));
  const sections: { key: string; rows: V2Transaction[] }[] = [];
  for (const row of transactions) {
    const key = sectionKey(row);
    const current = sections.at(-1);
    if (current?.key === key) current.rows.push(row);
    else sections.push({ key, rows: [row] });
  }
  return sections.flatMap(({ key, rows }, index) => [
    {
      type: "header" as const,
      key: `header:${key}`,
      title: grouping === "day" ? dayTitle(key, today) : monthTitle(`${key}-01`),
      net: hasMore && index === sections.length - 1 ? null : sectionNet(rows),
      count: rows.length,
    },
    ...rows.map((transaction, index) => ({
      type: "row" as const,
      key: transaction.id,
      transaction,
      lastInSection: index === rows.length - 1,
    })),
  ]);
}

export function headerIndices(items: readonly LedgerListItem[]): number[] {
  return items.flatMap((item, index) => (item.type === "header" ? [index] : []));
}

export function signedAmount(transaction: V2Transaction): number {
  return signed(transaction);
}

import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import type { V2Transaction } from "@trove/api/v2/contracts";

import type { ActiveBudgetView } from "@/features/budget/home/home-model";

/** One day of the pay period on the safe-to-spend strip. */
export type SpendTick = "under" | "over" | "today" | "future";

/**
 * Everyday money per day this period: what the everyday envelopes started with (planned plus
 * rollover) spread evenly over the period. A past day over this line prints red.
 */
export function everydayAllowanceMinor(view: ActiveBudgetView): number {
  const days = periodLength(view.current.period);
  if (days <= 0) return 0;
  const everyday = new Set(
    view.envelopes.filter((envelope) => envelope.group === "everyday").map(({ id }) => id),
  );
  const available = view.current.envelopes
    .filter((totals) => everyday.has(totals.id))
    .reduce((sum, totals) => sum + totals.plannedMinor + totals.rolloverMinor, 0);
  return Math.floor(Math.max(available, 0) / days);
}

/** The categories the everyday envelopes collect spending from. */
export function everydayCategoryIds(view: ActiveBudgetView): ReadonlySet<string> {
  return new Set(
    view.envelopes
      .filter((envelope) => envelope.group === "everyday" && !envelope.archived)
      .flatMap((envelope) => envelope.categoryIds),
  );
}

/** Everyday spending per Ledger Date, in the budget's currency, through `today`. */
export function dailyEverydaySpend(
  transactions: readonly V2Transaction[],
  view: ActiveBudgetView,
  currency: string,
  today: string,
): ReadonlyMap<string, number> {
  const categories = everydayCategoryIds(view);
  const spend = new Map<string, number>();
  for (const transaction of transactions) {
    if (
      transaction.kind !== "expense" ||
      transaction.currency !== currency ||
      transaction.date < view.current.period.start ||
      transaction.date > today ||
      !categories.has(transaction.categoryId ?? "")
    )
      continue;
    spend.set(transaction.date, (spend.get(transaction.date) ?? 0) + transaction.amountMinor);
  }
  return spend;
}

export interface SpendTicksInput {
  readonly period: { readonly start: string; readonly end: string };
  readonly today: string;
  readonly spendByDay: ReadonlyMap<string, number>;
  readonly allowanceMinor: number;
}

/** One tick per day of the period: past days under or over the allowance, today, then the rest. */
export function spendTicks({
  period,
  today,
  spendByDay,
  allowanceMinor,
}: SpendTicksInput): SpendTick[] {
  const start = parseISO(period.start);
  return Array.from({ length: periodLength(period) }, (_, index) => {
    const date = format(addDays(start, index), "yyyy-MM-dd");
    if (date === today) return "today";
    if (date > today) return "future";
    return (spendByDay.get(date) ?? 0) > allowanceMinor ? "over" : "under";
  });
}

function periodLength(period: { readonly start: string; readonly end: string }): number {
  return differenceInCalendarDays(parseISO(period.end), parseISO(period.start)) + 1;
}

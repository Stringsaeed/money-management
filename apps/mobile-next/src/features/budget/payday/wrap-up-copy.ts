import { compactAmount } from "@/ui/trove";

import {
  RAISE_PERIODS,
  type Overspend,
  type RaiseSuggestion,
  type WrapUpSummary,
} from "./wrap-up-model";

/** One printed line of the wrap-up receipt. */
export interface WrapUpLine {
  readonly key: string;
  readonly emoji: string;
  readonly label: string;
  readonly value: string;
  /** Spent more than planned. */
  readonly over: boolean;
}

/** The receipt's stamp: "ON PLAN · 10 OF 11". */
export const onPlanStamp = (summary: WrapUpSummary): string =>
  `ON PLAN · ${summary.onPlanCount} OF ${summary.envelopeCount}`;

/**
 * Everyday spent of planned, Bills paid, and money set aside for big payments. A first month
 * may be partial, so it shows only Everyday; Bills is left off when there are none.
 */
export function wrapUpLines(
  summary: WrapUpSummary,
  firstMonth: boolean,
  currency: string,
): WrapUpLine[] {
  const money = (minor: number) => compactAmount(minor, currency);
  const { everyday, bills } = summary;
  const lines: WrapUpLine[] = [
    {
      key: "everyday",
      emoji: "🛒",
      label: `EVERYDAY · ${money(everyday.spentMinor)} OF`,
      value: money(everyday.plannedMinor),
      over: everyday.spentMinor > everyday.plannedMinor,
    },
  ];
  if (firstMonth) return lines;
  if (bills.total > 0) {
    lines.push({
      key: "bills",
      emoji: "🧾",
      label: `BILLS PAID · ${bills.paid} OF ${bills.total}`,
      value: `${money(summary.billsSpentMinor)}${bills.paid === bills.total ? " ✓" : ""}`,
      over: false,
    });
  }
  lines.push({
    key: "saved",
    emoji: "🏠",
    label: "SET ASIDE FOR BIG ONES",
    value: money(summary.savedMinor),
    over: false,
  });
  return lines;
}

/** "Dining & coffee: 40 not covered". */
export const overspendTitle = (item: Overspend, currency: string): string =>
  `${item.name}: ${compactAmount(item.overMinor, currency)} not covered`;

export const OVERSPEND_SUB = "Accept takes it from next month";
export const COVERED_SUB = "Paid back into Not planned yet from your envelopes.";
export const ACCEPTED_SUB = "Accepted. It already came out of your money to plan.";

/** "Dining went over 3 months running. Plan 650 next month?" */
export const raiseSentence = (suggestion: RaiseSuggestion, currency: string): string =>
  `${suggestion.name} went over ${RAISE_PERIODS} months running. Plan ${compactAmount(suggestion.suggestedMinor, currency)} next month?`;

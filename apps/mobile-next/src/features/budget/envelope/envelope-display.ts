import { differenceInCalendarDays, parseISO } from "date-fns";

import type { V2BudgetPeriod, V2EnvelopeGroup, V2EnvelopeTotals } from "@trove/api/v2/contracts";

import { amountAccessibilityLabel, compactAmount } from "@/ui/trove";
import { currencyFractionDigits } from "@/utils/money";

import { codeAmount, receiptFigure, signedCompact } from "./envelope-figures";
import { paceMinor } from "./envelope-model";

const clamp01 = (value: number) => (Number.isFinite(value) ? Math.min(Math.max(value, 0), 1) : 0);

/** Share of the pay period already gone, 0…1: where the pace tick stands on the bar. */
export function periodPace(period: V2BudgetPeriod, daysLeft: number): number {
  const total = differenceInCalendarDays(parseISO(period.end), parseISO(period.start)) + 1;
  if (!(total > 0)) return 0;
  return clamp01((total - daysLeft) / total);
}

export type HeroChipTone = "ok" | "neg";

export interface EnvelopeHeroModel {
  /** `588`, `−175`. */
  readonly figure: string;
  readonly negative: boolean;
  /** `of 1,600 planned · 14 days to go`. */
  readonly ofLine: string;
  /** Spent share of what the envelope started with; an overspent bar shows full. */
  readonly progress: number;
  readonly over: boolean;
  readonly chip: { readonly text: string; readonly tone: HeroChipTone };
  /** Spoken figure: "Left: 588.00 AED". */
  readonly accessibilityLabel: string;
}

type HeroTotals = Pick<V2EnvelopeTotals, "plannedMinor" | "rolloverMinor" | "leftMinor">;

/** M4 hero: what is left, out of what, how far through it, and the daily pace that keeps it. */
export function envelopeHero(
  totals: HeroTotals,
  daysLeft: number,
  currency: string,
): EnvelopeHeroModel {
  const { leftMinor } = totals;
  const availableMinor = totals.plannedMinor + totals.rolloverMinor;
  const over = leftMinor < 0;
  const progress = over ? 1 : availableMinor > 0 ? clamp01(1 - leftMinor / availableMinor) : 0;
  const days = `${daysLeft} ${daysLeft === 1 ? "day" : "days"} to go`;
  return {
    figure: signedCompact(leftMinor, currency),
    negative: over,
    ofLine: `of ${signedCompact(availableMinor, currency)} planned · ${days}`,
    progress,
    over,
    chip: heroChip(leftMinor, daysLeft, currency),
    accessibilityLabel: `Left: ${amountAccessibilityLabel(leftMinor, currency)}${over ? ". Over budget." : ""}`,
  };
}

function heroChip(leftMinor: number, daysLeft: number, currency: string) {
  if (leftMinor <= 0) return { text: "NOTHING LEFT TO SPEND HERE", tone: "neg" as const };
  const pace = paceMinor(leftMinor, daysLeft, 10 ** currencyFractionDigits(currency));
  if (pace > 0)
    return {
      text: `≈ ${currency} ${compactAmount(pace, currency)} A DAY KEEPS YOU ON PLAN`,
      tone: "ok" as const,
    };
  return { text: `${codeAmount(leftMinor, currency)} LEFT TO SPEND`, tone: "ok" as const };
}

export interface ReceiptLine {
  readonly label: string;
  readonly value: string;
}

/**
 * The envelope receipt: the plan, money moved in or out since, last month's carry, and the
 * spending. They add up to Left, which the slip prints as its total.
 */
export function envelopeReceiptLines(
  totals: Pick<V2EnvelopeTotals, "plannedMinor" | "budgetedMinor" | "rolloverMinor" | "spentMinor">,
  currency: string,
): ReceiptLine[] {
  const movedMinor = totals.plannedMinor - totals.budgetedMinor;
  return [
    { label: "PLANNED", value: receiptFigure(totals.budgetedMinor, currency) },
    ...(movedMinor === 0
      ? []
      : [
          {
            label: movedMinor > 0 ? "MOVED IN" : "MOVED OUT",
            value: receiptFigure(movedMinor, currency),
          },
        ]),
    { label: "FROM LAST MONTH", value: receiptFigure(totals.rolloverMinor, currency) },
    { label: "SPENT", value: receiptFigure(-totals.spentMinor, currency) },
  ];
}

/** O1 banner. Only Everyday overspend comes out of Safe to spend. */
export function overBannerText(group: V2EnvelopeGroup, overMinor: number, currency: string) {
  const amount = codeAmount(overMinor, currency);
  return group === "everyday"
    ? `Over by ${amount}. It's coming out of your Safe to spend.`
    : `Over by ${amount}. Cover it to keep your plan honest.`;
}

/** Section title over this period's spending; the count shows once every page is loaded. */
export function spendingListTitle(count: number, complete: boolean): string {
  return complete ? `THIS MONTH · ${count}` : "THIS MONTH";
}

export const WHY_LIST_TITLE = "WHY · BIGGEST SPENDS";

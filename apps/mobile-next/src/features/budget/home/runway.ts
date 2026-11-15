import type { V2BudgetCurrent } from "@trove/api/v2/contracts";

import type { RunwayTick } from "@/ui/trove";
import { currencyFractionDigits } from "@/utils/money";

import { periodLength } from "./spend-ticks";

const days = (count: number) => `${count} ${count === 1 ? "day" : "days"}`;

/**
 * Spoken summary of the runway strip:
 * "Day 17 of 30. 12 days under your daily amount, 4 over. 14 days to payday."
 */
export function runwayLabel(ticks: readonly RunwayTick[], daysLeft: number): string {
  const todayIndex = ticks.indexOf("today");
  const day = todayIndex >= 0 ? todayIndex + 1 : Math.max(ticks.length - daysLeft + 1, 1);
  const under = ticks.filter((tick) => tick === "under").length;
  const over = ticks.filter((tick) => tick === "over").length;
  const past = under + over > 0 ? ` ${days(under)} under your daily amount, ${over} over.` : "";
  return `Day ${day} of ${ticks.length}.${past} ${days(daysLeft)} to payday.`;
}

/** Share of the pay period gone, at the middle of today: the envelope bars' pace tick. */
export function periodPace(current: Pick<V2BudgetCurrent, "period" | "daysLeft">): number {
  const length = periodLength(current.period);
  if (length <= 0) return 0;
  const day = length - current.daysLeft + 1;
  return Math.min(Math.max((day - 0.5) / length, 0), 1);
}

/** Drops the minor units below one whole unit: 14,275 fils prints as "142", never "142.75". */
export function floorWholeMinor(minor: number, currency: string): number {
  const unit = 10 ** currencyFractionDigits(currency);
  return Math.floor(minor / unit) * unit;
}

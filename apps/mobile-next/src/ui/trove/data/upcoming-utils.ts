import { differenceInCalendarDays, parseISO } from "date-fns";

import { amountAccessibilityLabel, type SignDisplay } from "../amount";
import { dateChipParts } from "./date-chip-utils";
import { joinSpoken } from "./utils";

/**
 * Index of the next due item: the earliest date that is today or later, or -1 when
 * everything is already past. Dates are ISO (`yyyy-MM-dd`) in any order.
 */
export function nextUpcomingIndex(dates: readonly string[], today: string): number {
  const from = parseISO(today);
  let best = -1;
  let bestOffset = Number.POSITIVE_INFINITY;
  for (const [index, date] of dates.entries()) {
    const offset = differenceInCalendarDays(parseISO(date), from);
    if (offset >= 0 && offset < bestOffset) {
      best = index;
      bestOffset = offset;
    }
  }
  return best;
}

/** Row caption in capitals: `TODAY`, `TOMORROW`, `IN 2 DAYS`, `3 DAYS AGO`. */
export function dueInLabel(date: string, today: string): string {
  const offset = differenceInCalendarDays(parseISO(date), parseISO(today));
  if (offset === 0) return "TODAY";
  if (offset === 1) return "TOMORROW";
  if (offset === -1) return "YESTERDAY";
  return offset > 0 ? `IN ${offset} DAYS` : `${Math.abs(offset)} DAYS AGO`;
}

export interface UpcomingRowLabelInput {
  readonly date: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly minor: number;
  readonly currency: string;
  readonly next: boolean;
  readonly signDisplay: SignDisplay;
}

/** Builds the one phrase a screen reader gets for the whole row. */
export function upcomingRowLabel({
  date,
  title,
  subtitle,
  minor,
  currency,
  next,
  signDisplay,
}: UpcomingRowLabelInput): string {
  const spokenDate = dateChipParts(date).spoken;
  const plus = signDisplay === "always" && minor > 0 ? "plus " : "";
  return joinSpoken([
    title,
    `${next ? "next due" : "due"} ${spokenDate}`,
    subtitle,
    `${plus}${amountAccessibilityLabel(minor, currency)}`,
  ]);
}

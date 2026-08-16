import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  differenceInCalendarDays,
  differenceInCalendarMonths,
  differenceInCalendarYears,
  intlFormat,
  isAfter,
  isBefore,
  isSameDay,
} from "date-fns";

import type { RecurrenceFrequency, RecurringPayment } from "@/types";
import { parseDate, toDateString } from "./date";

export interface UpcomingRecurringPayment {
  payment: RecurringPayment;
  occurrenceDate: string;
}

type RecurrenceRule = Pick<RecurringPayment, "frequency" | "intervalCount">;

/**
 * Given a recurring payment rule and today's date, returns all "YYYY-MM-DD"
 * strings between lastGeneratedDate (exclusive) and today (inclusive) on which
 * a transaction should be generated.
 *
 * Occurrences are anchored on `startDate` and stepped by `intervalCount` units,
 * so "every 2 weeks" / "every 3 months" fall out for free.
 *
 * This is a pure function — easy to test independently.
 */
export function getPendingOccurrences(rule: RecurringPayment, todayStr: string): string[] {
  if (!rule.isActive) return [];

  const today = parseDate(todayStr);
  const anchor = parseDate(rule.startDate);
  const bound = endBound(rule, anchor);

  // Effective ceiling: min(today, endBound)
  const ceiling = bound && isBefore(bound, today) ? bound : today;

  // Effective floor: max(startDate, lastGeneratedDate + 1 day)
  const generatedFloor = rule.lastGeneratedDate
    ? addDays(parseDate(rule.lastGeneratedDate), 1)
    : anchor;
  const floor = isBefore(generatedFloor, anchor) ? anchor : generatedFloor;

  if (isAfter(floor, ceiling)) return [];

  const occurrences: string[] = [];
  let k = firstIndexOnOrAfter(anchor, floor, rule);
  let occurrence = addInterval(anchor, k, rule);

  while (!isAfter(occurrence, ceiling)) {
    occurrences.push(toDateString(occurrence));
    k += 1;
    occurrence = addInterval(anchor, k, rule);
  }

  return occurrences;
}

/** Returns the first scheduled occurrence strictly after today. */
export function getNextOccurrence(rule: RecurringPayment, todayStr: string): string | null {
  if (!rule.isActive) return null;

  const today = parseDate(todayStr);
  const anchor = parseDate(rule.startDate);
  const tomorrow = addDays(today, 1);
  const generatedFloor = rule.lastGeneratedDate
    ? addDays(parseDate(rule.lastGeneratedDate), 1)
    : anchor;
  const floor = [anchor, generatedFloor, tomorrow].reduce((latest, date) =>
    isAfter(date, latest) ? date : latest,
  );

  const bound = endBound(rule, anchor);
  if (bound && isBefore(bound, floor)) return null;

  const k = firstIndexOnOrAfter(anchor, floor, rule);
  const occurrence = addInterval(anchor, k, rule);

  return bound && isAfter(occurrence, bound) ? null : toDateString(occurrence);
}

export function getUpcomingRecurringPayments(
  rules: RecurringPayment[],
  todayStr: string,
  limit = 3,
): UpcomingRecurringPayment[] {
  return rules
    .map((payment) => ({ payment, occurrenceDate: getNextOccurrence(payment, todayStr) }))
    .filter((item): item is UpcomingRecurringPayment => item.occurrenceDate !== null)
    .sort((a, b) => a.occurrenceDate.localeCompare(b.occurrenceDate))
    .slice(0, limit);
}

export function formatUpcomingOccurrence(dateStr: string, todayStr: string): string {
  const date = parseDate(dateStr);
  const tomorrow = addDays(parseDate(todayStr), 1);

  if (isSameDay(date, tomorrow)) return "Tomorrow";

  return intlFormat(date, { weekday: "short", month: "short", day: "numeric" });
}

const PRESET_LABEL: Record<RecurrenceFrequency, string> = {
  day: "Daily",
  week: "Weekly",
  month: "Monthly",
  year: "Yearly",
};

const UNIT_PLURAL: Record<RecurrenceFrequency, string> = {
  day: "days",
  week: "weeks",
  month: "months",
  year: "years",
};

/** Human-readable cadence label, e.g. "Daily", "Every 2 weeks", "Every 3 months". */
export function formatRecurrence(rule: RecurrenceRule): string {
  if (rule.intervalCount <= 1) return PRESET_LABEL[rule.frequency];
  return `Every ${rule.intervalCount} ${UNIT_PLURAL[rule.frequency]}`;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** The anchor date shifted by `k` recurrence steps (k × intervalCount units). */
function addInterval(anchor: Date, k: number, rule: RecurrenceRule): Date {
  const step = k * rule.intervalCount;

  switch (rule.frequency) {
    case "day":
      return addDays(anchor, step);
    case "week":
      return addWeeks(anchor, step);
    case "month":
      return addMonths(anchor, step); // clamps month-end (Jan 31 +1mo → Feb 28)
    case "year":
      return addYears(anchor, step);
  }
}

/** Smallest index k ≥ 0 such that the k-th occurrence is on or after `floor`. */
function firstIndexOnOrAfter(anchor: Date, floor: Date, rule: RecurrenceRule): number {
  if (!isBefore(anchor, floor)) return 0;

  // Start one step below a safe estimate (calendar diffs never undercount by more
  // than a step), then walk up — guarantees we never skip the first occurrence.
  const estimate = Math.floor(estimateSteps(anchor, floor, rule.frequency) / rule.intervalCount);
  let k = Math.max(0, estimate - 1);

  while (isBefore(addInterval(anchor, k, rule), floor)) k += 1;

  return k;
}

/** Approximate number of `frequency` units between anchor and floor. */
function estimateSteps(anchor: Date, floor: Date, frequency: RecurrenceFrequency): number {
  switch (frequency) {
    case "day":
      return differenceInCalendarDays(floor, anchor);
    case "week":
      return differenceInCalendarDays(floor, anchor) / 7;
    case "month":
      return differenceInCalendarMonths(floor, anchor);
    case "year":
      return differenceInCalendarYears(floor, anchor);
  }
}

/** The date after which no more occurrences are generated (min of endDate / Nth occurrence). */
function endBound(
  rule: Pick<RecurringPayment, "frequency" | "intervalCount" | "endDate" | "endCount">,
  anchor: Date,
): Date | null {
  let bound: Date | null = rule.endDate ? parseDate(rule.endDate) : null;

  if (rule.endCount != null && rule.endCount >= 1) {
    const nth = addInterval(anchor, rule.endCount - 1, rule);
    if (bound === null || isBefore(nth, bound)) bound = nth;
  }

  return bound;
}

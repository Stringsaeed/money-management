import {
  addDays,
  addMonths as addCalendarMonths,
  addWeeks,
  addYears,
  getDay,
  getMonth,
  getYear,
  isAfter,
  isBefore,
  setDate as setDayOfMonth,
  setMonth,
  startOfMonth,
  startOfYear,
} from "date-fns";

import type { RecurringPayment } from "@/types";
import { clampDay, parseDate, toDateString } from "./date";

/**
 * Given a recurring payment rule and today's date, returns all "YYYY-MM-DD"
 * strings between lastGeneratedDate (exclusive) and today (inclusive) on which
 * a transaction should be generated.
 *
 * This is a pure function — easy to test independently.
 */
export function getPendingOccurrences(rule: RecurringPayment, todayStr: string): string[] {
  if (!rule.isActive) return [];

  const today = parseDate(todayStr);
  const start = parseDate(rule.startDate);
  const end = rule.endDate ? parseDate(rule.endDate) : null;

  // Effective ceiling: min(today, endDate)
  const ceiling = end && isBefore(end, today) ? end : today;

  // Effective floor: max(startDate, lastGeneratedDate + 1 day)
  const floor = rule.lastGeneratedDate ? addDays(parseDate(rule.lastGeneratedDate), 1) : start;

  if (isAfter(floor, ceiling)) return [];

  const occurrences: string[] = [];

  switch (rule.interval) {
    case "daily":
      collectDaily(floor, ceiling, occurrences);
      break;
    case "weekly":
      collectWeekly(floor, ceiling, rule.dayOfWeek ?? 1, occurrences);
      break;
    case "monthly":
      collectMonthly(floor, ceiling, rule.dayOfMonth ?? 1, occurrences);
      break;
    case "yearly":
      collectYearly(floor, ceiling, rule.monthOfYear ?? 1, rule.dayOfMonth ?? 1, occurrences);
      break;
  }

  return occurrences;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function collectDaily(from: Date, to: Date, out: string[]): void {
  let current = from;

  while (!isAfter(current, to)) {
    out.push(toDateString(current));
    current = addDays(current, 1);
  }
}

function collectWeekly(
  from: Date,
  to: Date,
  targetDow: number, // 0=Sun … 6=Sat
  out: string[],
): void {
  let current = addDays(from, (targetDow - getDay(from) + 7) % 7);

  while (!isAfter(current, to)) {
    out.push(toDateString(current));
    current = addWeeks(current, 1);
  }
}

function collectMonthly(from: Date, to: Date, targetDay: number, out: string[]): void {
  let cursor = startOfMonth(from);

  while (!isAfter(cursor, to)) {
    const year = getYear(cursor);
    const month = getMonth(cursor) + 1;
    const candidate = setDayOfMonth(cursor, clampDay(year, month, targetDay));

    if (!isBefore(candidate, from) && !isAfter(candidate, to)) {
      out.push(toDateString(candidate));
    }

    cursor = addCalendarMonths(cursor, 1);
  }
}

function collectYearly(
  from: Date,
  to: Date,
  targetMonth: number,
  targetDay: number,
  out: string[],
): void {
  let cursor = startOfYear(from);

  while (!isAfter(cursor, to)) {
    const year = getYear(cursor);
    const candidate = setDayOfMonth(
      setMonth(cursor, targetMonth - 1),
      clampDay(year, targetMonth, targetDay),
    );

    if (!isBefore(candidate, from) && !isAfter(candidate, to)) {
      out.push(toDateString(candidate));
    }

    cursor = addYears(cursor, 1);
  }
}

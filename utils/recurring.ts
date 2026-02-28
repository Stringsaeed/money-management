import type { RecurringPayment } from "@/types";
import { clampDay, toDateString } from "./date";

/**
 * Given a recurring payment rule and today's date, returns all "YYYY-MM-DD"
 * strings between lastGeneratedDate (exclusive) and today (inclusive) on which
 * a transaction should be generated.
 *
 * This is a pure function — easy to test independently.
 */
export function getPendingOccurrences(rule: RecurringPayment, todayStr: string): string[] {
  if (!rule.isActive) return [];

  const today = parseLocalDate(todayStr);
  const start = parseLocalDate(rule.startDate);
  const end = rule.endDate ? parseLocalDate(rule.endDate) : null;

  // Effective ceiling: min(today, endDate)
  const ceiling = end && end < today ? end : today;

  // Effective floor: max(startDate, lastGeneratedDate + 1 day)
  let floor: Date;
  if (rule.lastGeneratedDate) {
    floor = parseLocalDate(rule.lastGeneratedDate);
    floor.setDate(floor.getDate() + 1); // exclusive: day after last generated
  } else {
    floor = start;
  }

  if (floor > ceiling) return [];

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

function parseLocalDate(str: string): Date {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function collectDaily(from: Date, to: Date, out: string[]): void {
  const cur = new Date(from);
  while (cur <= to) {
    out.push(toDateString(cur));
    cur.setDate(cur.getDate() + 1);
  }
}

function collectWeekly(
  from: Date,
  to: Date,
  targetDow: number, // 0=Sun … 6=Sat
  out: string[],
): void {
  // Find first occurrence of targetDow >= from
  const cur = new Date(from);
  const daysUntil = (targetDow - cur.getDay() + 7) % 7;
  cur.setDate(cur.getDate() + daysUntil);

  while (cur <= to) {
    out.push(toDateString(cur));
    cur.setDate(cur.getDate() + 7);
  }
}

function collectMonthly(from: Date, to: Date, targetDay: number, out: string[]): void {
  // Start at the first month that has a valid occurrence >= from
  let year = from.getFullYear();
  let month = from.getMonth() + 1; // 1-indexed

  while (true) {
    const day = clampDay(year, month, targetDay);
    const candidate = new Date(year, month - 1, day);

    if (candidate > to) break;
    if (candidate >= from) {
      out.push(toDateString(candidate));
    }

    // Advance to next month
    const next = new Date(year, month, 1); // first of next month
    year = next.getFullYear();
    month = next.getMonth() + 1;
  }
}

function collectYearly(
  from: Date,
  to: Date,
  targetMonth: number,
  targetDay: number,
  out: string[],
): void {
  let year = from.getFullYear();

  while (true) {
    const day = clampDay(year, targetMonth, targetDay);
    const candidate = new Date(year, targetMonth - 1, day);

    if (candidate > to) break;
    if (candidate >= from) {
      out.push(toDateString(candidate));
    }
    year++;
  }
}

import {
  addMonths as addCalendarMonths,
  eachMonthOfInterval,
  endOfMonth,
  format,
  getDaysInMonth,
  getMonth,
  getYear,
  intlFormat,
  isAfter,
  parse,
  startOfDay,
  startOfMonth,
} from "date-fns";

const DATE_ONLY_PATTERN = "yyyy-MM-dd";

const buildDateString = (year: number, month: number, day = 1) =>
  `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

/**
 * Returns today's date as a "YYYY-MM-DD" string (local time).
 */
export function today(): string {
  return toDateString(new Date());
}

/**
 * Returns current timestamp as ISO 8601 string.
 */
export function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Convert a Date to "YYYY-MM-DD" (local time).
 */
export function toDateString(date: Date): string {
  return format(date, DATE_ONLY_PATTERN);
}

/**
 * Parse a "YYYY-MM-DD" string to a local Date at midnight.
 */
export function parseDate(dateStr: string): Date {
  return parse(dateStr, DATE_ONLY_PATTERN, startOfDay(new Date()));
}

/**
 * Format a date as a human-readable day header.
 * e.g. "Saturday, Feb 15"
 */
export function formatDayHeader(dateStr: string): string {
  return intlFormat(parseDate(dateStr), {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format a month + year.
 * e.g. { year: 2026, month: 2 } → "February 2026"
 */
export function formatMonth(year: number, month: number): string {
  return intlFormat(parseDate(buildDateString(year, month)), {
    month: "long",
    year: "numeric",
  });
}

/**
 * Returns the first and last date strings of a given month.
 * month is 1-indexed.
 */
export function monthBounds(year: number, month: number): { start: string; end: string } {
  const date = parseDate(buildDateString(year, month));
  return {
    start: toDateString(startOfMonth(date)),
    end: toDateString(endOfMonth(date)),
  };
}

/**
 * Add months to a year/month pair. Returns { year, month } (1-indexed month).
 */
export function addMonths(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const date = addCalendarMonths(parseDate(buildDateString(year, month)), delta);
  return { year: getYear(date), month: getMonth(date) + 1 };
}

/**
 * Returns the Budget Period ("YYYY-MM") immediately following `period`.
 */
export function nextBudgetPeriod(period: string): string {
  const [yearStr, monthStr] = period.split("-");
  const { year, month } = addMonths(Number(yearStr), Number(monthStr), 1);
  return `${year}-${String(month).padStart(2, "0")}`;
}

/**
 * Returns the number of days in a month (accounts for leap years).
 */
function daysInMonth(year: number, month: number): number {
  return getDaysInMonth(parseDate(buildDateString(year, month)));
}

/**
 * Clamp a day-of-month to the valid range for the given year/month.
 * e.g. clampDay(2026, 2, 31) → 28
 */
export function clampDay(year: number, month: number, day: number): number {
  return Math.min(day, daysInMonth(year, month));
}

/**
 * Generate all months between two "YYYY-MM-DD" date strings, newest first.
 * Returns an empty array if either date is null/undefined.
 */
export function monthsBetween(
  minDate: string | null | undefined,
  maxDate: string | null | undefined,
): { year: number; month: number }[] {
  if (!minDate || !maxDate) return [];

  const start = startOfMonth(parseDate(minDate));
  const end = startOfMonth(parseDate(maxDate));

  if (isAfter(start, end)) return [];

  return eachMonthOfInterval({ start, end })
    .reverse()
    .map((date) => ({ year: getYear(date), month: getMonth(date) + 1 }));
}

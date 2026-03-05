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
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Parse a "YYYY-MM-DD" string to a local Date at midnight.
 */
export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Format a "YYYY-MM-DD" string using a display format string.
 * Supported tokens: YYYY, MM, DD
 */
export function formatDate(
  dateStr: string,
  format: "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD" = "MM/DD/YYYY",
): string {
  const [year, month, day] = dateStr.split("-");
  return format.replace("YYYY", year).replace("MM", month).replace("DD", day);
}

/**
 * Format a date as a human-readable day header.
 * e.g. "Saturday, Feb 15"
 */
export function formatDayHeader(dateStr: string): string {
  const date = parseDate(dateStr);
  return date.toLocaleDateString(undefined, {
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
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

/**
 * Returns the first and last date strings of a given month.
 * month is 1-indexed.
 */
export function monthBounds(year: number, month: number): { start: string; end: string } {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

/**
 * Add months to a year/month pair. Returns { year, month } (1-indexed month).
 */
export function addMonths(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const date = new Date(year, month - 1 + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

/**
 * Returns the number of days in a month (accounts for leap years).
 */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
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
  const [minY, minM] = minDate.split("-").map(Number);
  const [maxY, maxM] = maxDate.split("-").map(Number);
  const result: { year: number; month: number }[] = [];
  let y = maxY;
  let m = maxM;
  while (y > minY || (y === minY && m >= minM)) {
    result.push({ year: y, month: m });
    m -= 1;
    if (m === 0) {
      m = 12;
      y -= 1;
    }
  }
  return result;
}

import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  differenceInCalendarDays,
  differenceInCalendarMonths,
  differenceInCalendarYears,
  format,
  isAfter,
  isBefore,
  parse,
  startOfDay,
} from "date-fns";

const DATE_ONLY_PATTERN = "yyyy-MM-dd";

export type RecurringRuleFrequency = "day" | "week" | "month" | "year";

export interface RecurringRuleCalendar {
  startDate: string;
  frequency: RecurringRuleFrequency;
  intervalCount: number;
  endDate: string | null;
  endCount: number | null;
}

export function scheduledDatesThrough(
  calendar: RecurringRuleCalendar,
  throughDate: string,
): string[] {
  if (!Number.isSafeInteger(calendar.intervalCount) || calendar.intervalCount < 1) {
    throw new Error("Recurring Rule interval must be a positive integer.");
  }

  const through = parseDate(throughDate);
  const end = calendar.endDate ? parseDate(calendar.endDate) : null;
  const ceiling = end && isBefore(end, through) ? end : through;
  const dates: string[] = [];

  for (let index = 0; ; index += 1) {
    if (calendar.endCount !== null && index >= calendar.endCount) break;

    const occurrence = occurrenceAt(calendar, index);
    if (isAfter(occurrence, ceiling)) break;
    dates.push(toDateString(occurrence));
  }

  return dates;
}

export function dateAfter(date: string): string {
  return toDateString(addDays(parseDate(date), 1));
}

export function nextScheduledDateOnOrAfter(
  calendar: RecurringRuleCalendar,
  floorDate: string,
): string | null {
  if (!Number.isSafeInteger(calendar.intervalCount) || calendar.intervalCount < 1) {
    throw new Error("Recurring Rule interval must be a positive integer.");
  }

  const floor = parseDate(floorDate);
  const anchor = parseDate(calendar.startDate);
  const index = firstIndexOnOrAfter(calendar, anchor, floor);
  if (calendar.endCount !== null && index >= calendar.endCount) return null;

  const occurrence = occurrenceAt(calendar, index);
  if (calendar.endDate && isAfter(occurrence, parseDate(calendar.endDate))) return null;
  return toDateString(occurrence);
}

function parseDate(date: string): Date {
  return parse(date, DATE_ONLY_PATTERN, startOfDay(new Date()));
}

function toDateString(date: Date): string {
  return format(date, DATE_ONLY_PATTERN);
}

function occurrenceAt(calendar: RecurringRuleCalendar, index: number): Date {
  const anchor = parseDate(calendar.startDate);
  const distance = index * calendar.intervalCount;

  switch (calendar.frequency) {
    case "day":
      return addDays(anchor, distance);
    case "week":
      return addWeeks(anchor, distance);
    case "month":
      return addMonths(anchor, distance);
    case "year":
      return addYears(anchor, distance);
  }
}

function firstIndexOnOrAfter(calendar: RecurringRuleCalendar, anchor: Date, floor: Date): number {
  if (!isBefore(anchor, floor)) return 0;

  const estimatedUnits = (() => {
    switch (calendar.frequency) {
      case "day":
        return differenceInCalendarDays(floor, anchor);
      case "week":
        return differenceInCalendarDays(floor, anchor) / 7;
      case "month":
        return differenceInCalendarMonths(floor, anchor);
      case "year":
        return differenceInCalendarYears(floor, anchor);
    }
  })();
  let index = Math.max(0, Math.floor(estimatedUnits / calendar.intervalCount) - 1);
  while (isBefore(occurrenceAt(calendar, index), floor)) index += 1;
  return index;
}

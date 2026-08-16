import { addDays, addMonths, addWeeks, addYears, isAfter, isBefore } from "date-fns";

import { parseDate, toDateString } from "@/utils/date";

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

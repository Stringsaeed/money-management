import { getCalendars } from "expo-localization";

import type { RecurringRulesClock } from "./types";

export function createSystemClock(): RecurringRulesClock {
  return {
    now: () => new Date(),
    localDate: (timeZone) => localDateInTimeZone(new Date(), timeZone),
  };
}

export function getSystemTimeZone(): string {
  return getCalendars()[0]?.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function localDateInTimeZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((candidate) => candidate.type === type)?.value;
  const year = part("year");
  const month = part("month");
  const day = part("day");
  if (!year || !month || !day) {
    throw new Error(`Cannot resolve a local date for time zone ${timeZone}.`);
  }
  return `${year}-${month}-${day}`;
}

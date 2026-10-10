import { format, isValid, parse, parseISO, subDays } from "date-fns";

/** Dates cross component boundaries as `yyyy-MM-dd` keys, never as instants. */
const DATE_KEY_FORMAT = "yyyy-MM-dd";

export const toDateKey = (date: Date): string => format(date, DATE_KEY_FORMAT);

/** Parses a strict `yyyy-MM-dd` key; anything else (including `2026-02-31`) is null. */
export function parseDateKey(key: string): Date | null {
  const parsed = parse(key, DATE_KEY_FORMAT, new Date());
  return isValid(parsed) && toDateKey(parsed) === key ? parsed : null;
}

/** The key as a local date, falling back to `fallback` for an unreadable key. */
export const dateFromKey = (key: string, fallback: Date): Date => parseDateKey(key) ?? fallback;

/** Native date pickers exchange UTC-midnight instants for date-only values. */
export function pickerValueFromKey(key: string, fallback: Date): Date {
  return parseISO(`${parseDateKey(key) ? key : toDateKey(fallback)}T00:00:00.000Z`);
}

/** Reads a native UTC-midnight date back as a key without applying the device time zone. */
export const keyFromPickerValue = (value: Date): string => value.toISOString().slice(0, 10);

export interface QuickDateChip {
  id: "today" | "yesterday" | "two-days-ago";
  label: string;
  dateKey: string;
}

/** Today, yesterday and two days ago, relative to `today`. */
export function quickDateChips(today: Date): readonly QuickDateChip[] {
  return [
    { id: "today", label: "Today", dateKey: toDateKey(today) },
    { id: "yesterday", label: "Yesterday", dateKey: toDateKey(subDays(today, 1)) },
    { id: "two-days-ago", label: "2 days ago", dateKey: toDateKey(subDays(today, 2)) },
  ];
}

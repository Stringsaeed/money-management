import { format, isValid, parse, parseISO } from "date-fns";

export function todayDateKey(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function parseDateKey(value: string): Date | null {
  const parsed = parse(value, "yyyy-MM-dd", new Date());
  return isValid(parsed) && format(parsed, "yyyy-MM-dd") === value ? parsed : null;
}

export function dateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/** Native date pickers exchange UTC-midnight instants for date-only values. */
export function datePickerValue(value: string): Date {
  const parsed = parseDateKey(value);
  return parseISO(`${parsed ? value : todayDateKey()}T00:00:00.000Z`);
}

/** Serialize a native UTC-midnight date without applying the device time zone. */
export function dateKeyFromPicker(value: Date): string {
  return value.toISOString().slice(0, 10);
}

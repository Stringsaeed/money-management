import { addDays, intlFormat, isSameDay } from "date-fns";

import type { RecurrenceFrequency } from "@/types";

import { parseDate } from "./date";

type RecurrenceRule = {
  frequency: RecurrenceFrequency;
  intervalCount: number;
};

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

export function formatRecurrence(rule: RecurrenceRule): string {
  if (rule.intervalCount <= 1) return PRESET_LABEL[rule.frequency];
  return `Every ${rule.intervalCount} ${UNIT_PLURAL[rule.frequency]}`;
}

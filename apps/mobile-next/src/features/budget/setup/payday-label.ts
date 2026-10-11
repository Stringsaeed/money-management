import type { V2PaydayRule } from "@trove/api/v2/contracts";

/** 1 -> "1st", 22 -> "22nd", 25 -> "25th". */
export function ordinal(day: number): string {
  const lastTwo = day % 100;
  if (lastTwo >= 11 && lastTwo <= 13) return `${day}th`;
  const suffix = { 1: "st", 2: "nd", 3: "rd" }[day % 10] ?? "th";
  return `${day}${suffix}`;
}

export const paydayLabel = (rule: V2PaydayRule): string =>
  rule.kind === "last_workday" ? "Last workday" : ordinal(rule.day);

import { addDays } from "date-fns";

import type { V2BudgetCurrent, V2DueOccurrence } from "@trove/api/v2/contracts";

import { dateKey, parseDateKey } from "@/utils/date";

export type DueSectionKey = "overdue" | "today" | "week" | "payday";

export interface DueSection {
  readonly key: DueSectionKey;
  readonly title: string;
  readonly items: readonly V2DueOccurrence[];
}

const SECTION_TITLES = {
  overdue: "Overdue",
  today: "Today",
  week: "This week",
  payday: "Next payday",
} as const satisfies Record<DueSectionKey, string>;

/** How far ahead the Due list is fetched, so reminders can be scheduled for the days ahead. */
export const DUE_LOOKAHEAD_DAYS = 13;

const shiftDays = (date: string, days: number): string => {
  const parsed = parseDateKey(date);
  return parsed ? dateKey(addDays(parsed, days)) : date;
};

export const nextDay = (date: string): string => shiftDays(date, 1);

/** Today's Ledger Date, derived from the projection so it matches the engine's idea of "today". */
export function budgetToday(current: Pick<V2BudgetCurrent, "period" | "daysLeft">): string {
  return shiftDays(current.period.end, -(current.daysLeft - 1));
}

/** The first day of the next Budget Period: the day the next salary is expected. */
export function nextPaydayDate(current: Pick<V2BudgetCurrent, "period">): string {
  return shiftDays(current.period.end, 1);
}

/** The Ledger Date the Due query reads through: the next payday, or two weeks ahead if later. */
export function dueThrough(today: string, nextPayday: string): string {
  const lookahead = shiftDays(today, DUE_LOOKAHEAD_DAYS);
  return nextPayday > lookahead ? nextPayday : lookahead;
}

export interface DueGrouping {
  readonly today: string;
  /** Last day of "This week": today plus six days. */
  readonly weekEnd: string;
  readonly nextPayday: string;
}

function sectionOf(item: V2DueOccurrence, grouping: DueGrouping): DueSectionKey | null {
  if (item.overdue || item.scheduledDate < grouping.today) return "overdue";
  if (item.scheduledDate === grouping.today) return "today";
  if (item.scheduledDate <= grouping.weekEnd) return "week";
  if (item.scheduledDate <= grouping.nextPayday) return "payday";
  return null;
}

const SECTION_KEYS = ["overdue", "today", "week", "payday"] as const;

/** Overdue, Today, This week, then everything else up to the next payday. Later items are not listed. */
export function groupDue(items: readonly V2DueOccurrence[], grouping: DueGrouping): DueSection[] {
  return SECTION_KEYS.map((key) => ({
    key,
    title: SECTION_TITLES[key],
    items: items.filter((item) => sectionOf(item, grouping) === key),
  }));
}

export function dueGrouping(today: string, nextPayday: string): DueGrouping {
  return { today, weekEnd: shiftDays(today, 6), nextPayday };
}

export interface DueNow {
  /** Bills due today plus overdue ones: what Budget home calls "Due today". */
  readonly count: number;
  readonly totalMinor: number;
}

export function dueNow(items: readonly V2DueOccurrence[], today: string): DueNow {
  const due = items.filter((item) => item.overdue || item.scheduledDate <= today);
  return { count: due.length, totalMinor: due.reduce((sum, item) => sum + item.amountMinor, 0) };
}

/** One bill occurrence, for keys that must survive a refetch. */
export const occurrenceKey = (item: Pick<V2DueOccurrence, "ruleId" | "scheduledDate">): string =>
  `${item.ruleId}|${item.scheduledDate}`;

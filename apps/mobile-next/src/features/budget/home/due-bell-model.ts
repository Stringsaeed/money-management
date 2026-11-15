import type { DueSection } from "../due/due-model";

/** Bills on the Due list through this week (overdue, today, this week): the bell's badge. */
export function dueThisWeekCount(sections: readonly DueSection[]): number {
  return sections
    .filter((section) => section.key !== "payday")
    .reduce((count, section) => count + section.items.length, 0);
}

/** The bell's spoken label: "Due: 2 bills this week". */
export function dueBellLabel(count: number): string {
  return count > 0
    ? `Due: ${count} ${count === 1 ? "bill" : "bills"} this week`
    : "Due: nothing this week";
}

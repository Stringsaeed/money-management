/**
 * Saving-for suggestion (#373): how much to set aside each payday to reach a
 * target by its due date.
 */
import { nextPeriodStart, type PaydayRule } from "./periods";

export interface SavingGoal {
  targetMinor: number;
  setAsideMinor: number;
  /** `YYYY-MM-DD` the money is needed by. */
  dueDate: string;
  rule: PaydayRule;
  currentPeriodStart: string;
}

/** Period starts after the current one, up to and including the due date. At least 1. */
export function paydaysLeft(goal: SavingGoal): number {
  let count = 0;
  let start = nextPeriodStart(goal.rule, goal.currentPeriodStart);
  while (start <= goal.dueDate) {
    count += 1;
    start = nextPeriodStart(goal.rule, start);
  }
  return Math.max(count, 1);
}

/** `ceil((target - setAside) / paydaysLeft)` in minor units; 0 once the target is met. */
export function savingPerPayday(goal: SavingGoal): number {
  const remainingMinor = goal.targetMinor - goal.setAsideMinor;
  if (remainingMinor <= 0) return 0;
  return Math.ceil(remainingMinor / paydaysLeft(goal));
}

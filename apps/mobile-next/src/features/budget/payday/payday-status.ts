import { differenceInCalendarDays, subDays } from "date-fns";

import { dateKey, parseDateKey } from "@/utils/date";

/** The first days of a period count as "did your salary land?"; after that the salary is late. */
export const PAYDAY_ON_TIME_DAYS = 3;

/** A salary that lands up to this many days before payday is this period's salary, paid early. */
export const EARLY_PAY_DAYS = 7;

/** The first Ledger Date whose income counts as this period's salary. */
export function salaryWindowStart(periodStart: string): string {
  const start = parseDateKey(periodStart);
  return start ? dateKey(subDays(start, EARLY_PAY_DAYS)) : periodStart;
}

export interface PaydayInputs {
  /** The budget has a usual salary or a payday reminder, so a salary is expected each period. */
  readonly expectsSalary: boolean;
  /** Ledger Date of today. */
  readonly today: string;
  readonly periodStart: string;
  /** The period the budget started in. */
  readonly activationPeriodStart: string;
  /** The Ledger Date the budget was started. */
  readonly activatedOn: string;
  /**
   * Income Transactions into a funding account dated from `salaryWindowStart(periodStart)` to
   * today; `null` while unknown.
   */
  readonly incomeCount: number | null;
}

export type PaydayStatus =
  | { readonly pending: false }
  /** `late` is true once the first days of the period have passed without a logged salary. */
  | { readonly pending: true; readonly late: boolean };

/**
 * Payday is pending while a salary is expected and none has been logged since the period began
 * (or in the days just before it, for an early salary). It stays pending (as late) for the whole
 * period: the period still started, and Safe to spend only counts the money you have.
 * A budget started after its first payday already counted that salary in the balances it began
 * with, so the activation period is never pending then.
 */
export function paydayStatus({
  expectsSalary,
  today,
  periodStart,
  activationPeriodStart,
  activatedOn,
  incomeCount,
}: PaydayInputs): PaydayStatus {
  if (!expectsSalary || incomeCount === null || incomeCount > 0) return { pending: false };
  if (periodStart === activationPeriodStart && activatedOn > periodStart) return { pending: false };
  const start = parseDateKey(periodStart);
  const now = parseDateKey(today);
  const daysIn = start && now ? differenceInCalendarDays(now, start) : 0;
  return { pending: true, late: daysIn >= PAYDAY_ON_TIME_DAYS };
}

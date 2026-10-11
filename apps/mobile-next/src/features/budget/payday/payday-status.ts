import { differenceInCalendarDays } from "date-fns";

import { parseDateKey } from "@/utils/date";

/** The first days of a period count as "did your salary land?"; after that the salary is late. */
export const PAYDAY_ON_TIME_DAYS = 3;

export interface PaydayInputs {
  /** The budget has a usual salary or a payday reminder, so a salary is expected each period. */
  readonly expectsSalary: boolean;
  /** Ledger Date of today. */
  readonly today: string;
  readonly periodStart: string;
  /** Income Transactions into a funding account dated in the current period; `null` while unknown. */
  readonly incomeCount: number | null;
}

export type PaydayStatus =
  | { readonly pending: false }
  /** `late` is true once the first days of the period have passed without a logged salary. */
  | { readonly pending: true; readonly late: boolean };

/**
 * Payday is pending while a salary is expected and none has been logged since the period began.
 * It stays pending (as late) for the whole period: the period still started, and Safe to spend
 * only counts the money you have.
 */
export function paydayStatus({
  expectsSalary,
  today,
  periodStart,
  incomeCount,
}: PaydayInputs): PaydayStatus {
  if (!expectsSalary || incomeCount === null || incomeCount > 0) return { pending: false };
  const start = parseDateKey(periodStart);
  const now = parseDateKey(today);
  const daysIn = start && now ? differenceInCalendarDays(now, start) : 0;
  return { pending: true, late: daysIn >= PAYDAY_ON_TIME_DAYS };
}

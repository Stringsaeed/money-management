import { differenceInCalendarDays, format, subDays } from "date-fns";

import type { V2BudgetPeriod } from "@trove/api/v2/contracts";

import { dateKey, parseDateKey } from "@/utils/date";

import { periodLabel } from "../envelope/envelope-model";
import type { PaydayStep } from "./payday-flow";

/** Got paid's kicker: the payday the period starts on, e.g. "PAYDAY · SUN 25 OCT". */
export function paydayKicker(periodStart: string): string {
  const start = parseDateKey(periodStart);
  return start ? `PAYDAY · ${format(start, "EEE d MMM").toUpperCase()}` : "PAYDAY";
}

/** The salary's date as Got paid prints it: "Today, 25 Oct", "Yesterday, 24 Oct", "Fri, 23 Oct". */
export function gotPaidDateLabel(date: string, today: string): string {
  const day = parseDateKey(date);
  const now = parseDateKey(today);
  if (!day || !now) return date;
  const short = format(day, "d MMM");
  if (date === today) return `Today, ${short}`;
  if (date === dateKey(subDays(now, 1))) return `Yesterday, ${short}`;
  return format(day, "EEE, d MMM");
}

const NEXT_STEP = {
  wrapUp: "Next, a 2-minute wrap-up.",
  leftovers: "Next, choose where your leftovers go.",
  plan: "Next, plan your month.",
} as const satisfies Record<PaydayStep, string>;

/** The line under Got paid's fields; it names the next step when logging runs the payday ritual. */
export function gotPaidNote(period: V2BudgetPeriod, next: PaydayStep | null): string {
  const starts = `This starts your new month: ${periodLabel(period)}.`;
  return next ? `${starts} ${NEXT_STEP[next]}` : starts;
}

/** A period as the step titles stamp it: "25 SEP – 24 OCT". */
export const periodStamp = (period: V2BudgetPeriod): string => periodLabel(period).toUpperCase();

/** Days in a period, both ends counted: 25 Oct – 24 Nov is 31. */
export function periodDays(period: V2BudgetPeriod): number {
  const start = parseDateKey(period.start);
  const end = parseDateKey(period.end);
  return start && end ? differenceInCalendarDays(end, start) + 1 : 0;
}

/** Plan new month's stamp: "25 OCT – 24 NOV · 31 DAYS". */
export function planPeriodStamp(period: V2BudgetPeriod): string {
  const days = periodDays(period);
  return days > 0
    ? `${periodStamp(period)} · ${days} ${days === 1 ? "DAY" : "DAYS"}`
    : periodStamp(period);
}

/** A Ledger Date as a receipt label prints it: "25 OCT". */
export function receiptDate(date: string): string {
  const day = parseDateKey(date);
  return day ? format(day, "d MMM").toUpperCase() : date;
}

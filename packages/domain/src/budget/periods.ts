/**
 * Payday-anchored Budget Periods (#366, option (a)).
 *
 * A Budget Period is identified by its start date (`YYYY-MM-DD`). Each month
 * has exactly one start under a Payday Rule. Membership is a string compare on
 * the stored Ledger Date; no time zone ever moves a date.
 */
import {
  addMonths,
  differenceInCalendarDays,
  format,
  isWeekend,
  lastDayOfMonth,
  parseISO,
  setDate,
  subDays,
} from "date-fns";

const DATE_PATTERN = "yyyy-MM-dd";

/** Payday on a fixed day (1-28; 29-31 are not representable) or the last Mon-Fri of the month. */
export type PaydayRule = { kind: "day"; day: number } | { kind: "last_workday" };

/** One insert-only row of payday history: `rule` applies from the period starting `effectiveFrom`. */
export interface PaydayChange {
  effectiveFrom: string;
  rule: PaydayRule;
}

/** Inclusive `YYYY-MM-DD` bounds. */
export interface BudgetPeriod {
  start: string;
  end: string;
}

/** The start date of the period that begins in `yearMonth` (`YYYY-MM`). */
export function periodStartForMonth(rule: PaydayRule, yearMonth: string): string {
  const firstOfMonth = parseISO(`${yearMonth}-01`);
  if (rule.kind === "day") {
    if (!Number.isInteger(rule.day) || rule.day < 1 || rule.day > 28) {
      throw new Error(`Payday day must be a whole number from 1 to 28, got ${rule.day}.`);
    }
    return toDateString(setDate(firstOfMonth, rule.day));
  }
  let day = lastDayOfMonth(firstOfMonth);
  while (isWeekend(day)) day = subDays(day, 1);
  return toDateString(day);
}

/** The first start under `rule` strictly after `start`, scanning its month then the next. */
export function nextPeriodStart(rule: PaydayRule, start: string): string {
  const month = start.slice(0, 7);
  const sameMonth = periodStartForMonth(rule, month);
  if (sameMonth > start) return sameMonth;
  return periodStartForMonth(rule, shiftMonth(month, 1));
}

/** The period containing `date` under a single rule. */
export function periodContaining(rule: PaydayRule, date: string): BudgetPeriod {
  const month = date.slice(0, 7);
  const thisMonth = periodStartForMonth(rule, month);
  const start = date < thisMonth ? periodStartForMonth(rule, shiftMonth(month, -1)) : thisMonth;
  return { start, end: dayBefore(nextPeriodStart(rule, start)) };
}

/**
 * The period sequence from `activationStart` through the period containing
 * `throughDate`. Each period's end comes from the rule in effect at its start,
 * so a rule change (recorded at the current period start) never moves earlier
 * periods.
 */
export function budgetPeriods(
  paydays: readonly PaydayChange[],
  activationStart: string,
  throughDate: string,
): BudgetPeriod[] {
  if (throughDate < activationStart) {
    throw new Error(`Date ${throughDate} is before the budget activation ${activationStart}.`);
  }
  const periods: BudgetPeriod[] = [];
  let start = activationStart;
  while (start <= throughDate) {
    const next = nextPeriodStart(ruleInEffect(paydays, start), start);
    periods.push({ start, end: dayBefore(next) });
    start = next;
  }
  return periods;
}

/** The rule from the latest history row whose `effectiveFrom` is on or before `start`. */
export function ruleInEffect(paydays: readonly PaydayChange[], start: string): PaydayRule {
  let found: PaydayChange | undefined;
  for (const change of paydays) {
    if (change.effectiveFrom <= start && (!found || change.effectiveFrom >= found.effectiveFrom)) {
      found = change;
    }
  }
  if (!found) throw new Error(`No payday rule is in effect on ${start}.`);
  return found.rule;
}

/** Days from `today` to `end`, both included (1 on the last day). */
export function daysLeftInclusive(today: string, end: string): number {
  return differenceInCalendarDays(parseISO(end), parseISO(today)) + 1;
}

function shiftMonth(yearMonth: string, months: number): string {
  return format(addMonths(parseISO(`${yearMonth}-01`), months), "yyyy-MM");
}

function dayBefore(date: string): string {
  return toDateString(subDays(parseISO(date), 1));
}

function toDateString(date: Date): string {
  return format(date, DATE_PATTERN);
}

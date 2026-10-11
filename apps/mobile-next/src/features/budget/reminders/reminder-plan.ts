import { addDays } from "date-fns";

import { nextPeriodStart, type PaydayRule } from "@trove/domain/budget";

import { dateKey, parseDateKey } from "@/utils/date";

import { snoozedUntil, type ReminderPrefs } from "./reminder-prefs";

export interface ReminderBill {
  readonly ruleId: string;
  /** The currency of the budget the bill belongs to. */
  readonly currency: string;
  readonly scheduledDate: string;
  readonly name: string;
  readonly amountMinor: number;
}

/** One local notification, to be delivered on `day` (a Ledger Date) at the reminder hour. */
export interface PlannedReminder {
  readonly kind: "bills" | "payday";
  /** The budget a tap opens: a payday's own, or the first bill's when budgets batch. */
  readonly currency: string;
  readonly day: string;
  readonly title: string;
  readonly body: string;
}

interface ReminderMessage {
  readonly title: string;
  readonly body: string;
}

/** Formats an amount in the currency of the budget it belongs to. */
export type MoneyFormatter = (minor: number, currency: string) => string;

/** The day a bill's reminder goes out: its due date, or the day a snooze ends. */
function reminderDay(bill: ReminderBill, prefs: ReminderPrefs): string {
  const until = snoozedUntil(prefs, bill.ruleId, bill.scheduledDate);
  return until && until > bill.scheduledDate ? until : bill.scheduledDate;
}

/** "Car loan AED 1,850.00 due today" for one bill, "3 bills due today" for several. */
export function billsMessage(
  bills: readonly ReminderBill[],
  day: string,
  money: MoneyFormatter,
): ReminderMessage {
  const allDueToday = bills.every((bill) => bill.scheduledDate === day);
  const allLate = bills.every((bill) => bill.scheduledDate < day);
  const status = allDueToday ? "due today" : allLate ? "overdue" : "due or overdue";
  const [only] = bills;
  if (bills.length === 1 && only) {
    return {
      title: "Bill reminder",
      body: `${only.name} ${money(only.amountMinor, only.currency)} ${status}`,
    };
  }
  return { title: "Bill reminders", body: `${bills.length} bills ${status}` };
}

interface PlanBillsInput {
  readonly bills: readonly ReminderBill[];
  readonly prefs: ReminderPrefs;
  readonly today: string;
  /** Reminders are planned for `today` through this many days after it. */
  readonly horizonDays: number;
  readonly money: MoneyFormatter;
}

/**
 * At most one reminder per day for the whole ledger: every unmuted bill that day, from every
 * budget, batched into one message that opens the budget of its first bill.
 * Overdue bills that are not snoozed get no push; they stay on the Due list until paid or skipped.
 */
export function planBillReminders({
  bills,
  prefs,
  today,
  horizonDays,
  money,
}: PlanBillsInput): PlannedReminder[] {
  const last = shiftDay(today, horizonDays);
  const byDay = new Map<string, ReminderBill[]>();
  for (const bill of bills) {
    if (prefs.mutedRuleIds.includes(bill.ruleId)) continue;
    const day = reminderDay(bill, prefs);
    if (day < today || day > last) continue;
    byDay.set(day, [...(byDay.get(day) ?? []), bill]);
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([day, dayBills]) => {
      const [first] = dayBills;
      return first
        ? [
            {
              kind: "bills" as const,
              currency: first.currency,
              day,
              ...billsMessage(dayBills, day, money),
            },
          ]
        : [];
    });
}

interface PlanPaydayInput {
  readonly currency: string;
  readonly rule: PaydayRule;
  /** Start of the Budget Period that contains today. */
  readonly currentPeriodStart: string;
  readonly today: string;
  /** How many upcoming paydays to schedule. */
  readonly count: number;
  /**
   * Salary is still unlogged this period, so a "Not yet" can bring the reminder back. Once it is
   * logged, today's payday reminder is dropped too.
   */
  readonly pending?: boolean;
  /** The Ledger Date the person last said "Not yet"; the reminder returns the day after. */
  readonly snoozedOn?: string | null;
}

/**
 * Payday reminders for today (if it is payday and the salary is not logged yet) and the next
 * paydays under the current rule, plus one for tomorrow when the person said "Not yet" today and
 * the salary is still unlogged. One per day at most.
 */
export function planPaydayReminders({
  currency,
  rule,
  currentPeriodStart,
  today,
  count,
  pending = false,
  snoozedOn = null,
}: PlanPaydayInput): PlannedReminder[] {
  const paydays = upcomingPaydays(rule, currentPeriodStart, count, (day) =>
    pending ? day >= today : day > today,
  );
  const retry = snoozedOn ? shiftDay(snoozedOn, 1) : null;
  if (pending && retry && retry >= today && !paydays.includes(retry)) paydays.push(retry);
  return paydays.sort().map((day) => ({
    kind: "payday",
    currency,
    day,
    title: "Payday",
    body: "Did your salary land? Open Trove to see your budget.",
  }));
}

/** The first `count` period starts from `currentPeriodStart` on that `keep` accepts. */
function upcomingPaydays(
  rule: PaydayRule,
  currentPeriodStart: string,
  count: number,
  keep: (day: string) => boolean,
): string[] {
  const days: string[] = [];
  let start = currentPeriodStart;
  for (let step = 0; step <= count; step += 1) {
    if (keep(start)) days.push(start);
    start = nextPeriodStart(rule, start);
  }
  return days.slice(0, count);
}

function shiftDay(day: string, days: number): string {
  const parsed = parseDateKey(day);
  return parsed ? dateKey(addDays(parsed, days)) : day;
}

/** What one budget contributes to the ledger's reminders. */
export interface BudgetReminderSource {
  readonly currency: string;
  /** Pending bills of this budget, snoozed ones included. */
  readonly bills: readonly ReminderBill[];
  readonly payday: Omit<PlanPaydayInput, "currency" | "today">;
}

/**
 * Every reminder for one ledger. Bills from all budgets share one notification per day; each
 * budget keeps its own payday reminder, because each has its own payday.
 */
export function planLedgerReminders(input: {
  readonly sources: readonly BudgetReminderSource[];
  readonly prefs: ReminderPrefs;
  readonly today: string;
  readonly horizonDays: number;
  readonly money: MoneyFormatter;
}): PlannedReminder[] {
  const { sources, prefs, today, horizonDays, money } = input;
  const bills = planBillReminders({
    bills: sources.flatMap((source) => source.bills),
    prefs,
    today,
    horizonDays,
    money,
  });
  const paydays = sources.flatMap((source) =>
    planPaydayReminders({ ...source.payday, currency: source.currency, today }),
  );
  return [...bills, ...paydays];
}

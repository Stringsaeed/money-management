import { addDays } from "date-fns";

import { nextPeriodStart, type PaydayRule } from "@trove/domain/budget";

import { dateKey, parseDateKey } from "@/utils/date";

import { snoozedUntil, type ReminderPrefs } from "./reminder-prefs";

export interface ReminderBill {
  readonly ruleId: string;
  readonly scheduledDate: string;
  readonly name: string;
  readonly amountMinor: number;
}

/** One local notification, to be delivered on `day` (a Ledger Date) at the reminder hour. */
export interface PlannedReminder {
  readonly kind: "bills" | "payday";
  readonly day: string;
  readonly title: string;
  readonly body: string;
}

interface ReminderMessage {
  readonly title: string;
  readonly body: string;
}

/** The day a bill's reminder goes out: its due date, or the day a snooze ends. */
function reminderDay(bill: ReminderBill, prefs: ReminderPrefs): string {
  const until = snoozedUntil(prefs, bill.ruleId, bill.scheduledDate);
  return until && until > bill.scheduledDate ? until : bill.scheduledDate;
}

/** "Car loan AED 1,850.00 due today" for one bill, "3 bills due today" for several. */
export function billsMessage(
  bills: readonly ReminderBill[],
  day: string,
  money: (minor: number) => string,
): ReminderMessage {
  const allDueToday = bills.every((bill) => bill.scheduledDate === day);
  const allLate = bills.every((bill) => bill.scheduledDate < day);
  const status = allDueToday ? "due today" : allLate ? "overdue" : "due or overdue";
  const [only] = bills;
  if (bills.length === 1 && only) {
    return { title: "Bill reminder", body: `${only.name} ${money(only.amountMinor)} ${status}` };
  }
  return { title: "Bill reminders", body: `${bills.length} bills ${status}` };
}

interface PlanBillsInput {
  readonly bills: readonly ReminderBill[];
  readonly prefs: ReminderPrefs;
  readonly today: string;
  /** Reminders are planned for `today` through this many days after it. */
  readonly horizonDays: number;
  readonly money: (minor: number) => string;
}

/**
 * At most one reminder per day: every unmuted bill that day batched into one message.
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
    .map(([day, dayBills]) => ({ kind: "bills", day, ...billsMessage(dayBills, day, money) }));
}

interface PlanPaydayInput {
  readonly rule: PaydayRule;
  /** Start of the Budget Period that contains today. */
  readonly currentPeriodStart: string;
  readonly today: string;
  /** How many upcoming paydays to schedule. */
  readonly count: number;
  /** Salary is still unlogged this period, so a "Not yet" can bring the reminder back. */
  readonly pending?: boolean;
  /** The Ledger Date the person last said "Not yet"; the reminder returns the day after. */
  readonly snoozedOn?: string | null;
}

/**
 * Payday reminders for today (if it is payday) and the next paydays under the current rule, plus
 * one for tomorrow when the person said "Not yet" today and the salary is still unlogged. One per
 * day at most.
 */
export function planPaydayReminders({
  rule,
  currentPeriodStart,
  today,
  count,
  pending = false,
  snoozedOn = null,
}: PlanPaydayInput): PlannedReminder[] {
  const days: string[] = [];
  let start = currentPeriodStart;
  for (let step = 0; step <= count; step += 1) {
    if (start >= today) days.push(start);
    start = nextPeriodStart(rule, start);
  }
  const paydays = days.slice(0, count);
  const retry = snoozedOn ? shiftDay(snoozedOn, 1) : null;
  if (pending && retry && retry >= today && !paydays.includes(retry)) paydays.push(retry);
  return paydays.sort().map((day) => ({
    kind: "payday",
    day,
    title: "Payday",
    body: "Did your salary land? Open Trove to see your budget.",
  }));
}

function shiftDay(day: string, days: number): string {
  const parsed = parseDateKey(day);
  return parsed ? dateKey(addDays(parsed, days)) : day;
}

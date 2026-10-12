import { format, parseISO } from "date-fns";

import { daysLeftInclusive } from "@trove/domain/budget";
import type { V2BudgetPeriod, V2PaydayRule } from "@trove/api/v2/contracts";

import { amountParts, compactAmount, MINUS } from "@/ui/trove";

import { paydayLabel } from "./payday-label";
import type { SetupItem } from "./setup-items";

/** "25 SEP": the day-and-month stamp the setup receipts print. */
const stampDate = (date: string): string => format(parseISO(date), "d MMM").toUpperCase();

const daysLeftLabel = (days: number): string => `${days} ${days === 1 ? "DAY" : "DAYS"} LEFT`;

/** S2 under the payday chips: "THIS MONTH: 25 SEP → 24 OCT · 14 DAYS LEFT". */
export const periodLine = (period: V2BudgetPeriod, today: string): string =>
  `THIS MONTH: ${stampDate(period.start)} → ${stampDate(period.end)} · ${daysLeftLabel(
    daysLeftInclusive(today, period.end),
  )}`;

/** S5 receipt head: "25 SEP — 24 OCT · 14 DAYS LEFT". */
export const receiptPeriodLine = (period: V2BudgetPeriod, daysLeft: number): string =>
  `${stampDate(period.start)} — ${stampDate(period.end)} · ${daysLeftLabel(daysLeft)}`;

/** S5: "EVERYDAY SPENT SINCE 25 SEP". */
export const everydaySpentLabel = (periodStart: string): string =>
  `EVERYDAY SPENT SINCE ${stampDate(periodStart)}`;

/** A bare receipt figure with its sign: "4,675", "−250", "75.50". */
export const figure = (minor: number, currency: string): string =>
  `${minor < 0 ? MINUS : ""}${compactAmount(minor, currency)}`;

/** A figure with its ISO code, as the action bar and the slip print it: "AED 14,200", "AED −250". */
export const moneyLabel = (minor: number, currency: string): string =>
  `${currency} ${figure(minor, currency)}`;

/** "Dirham" for AED, so "Every dirham has a job"; currencies without a word fall back to "bit". */
const UNIT_WORDS = new Map([
  ["AED", "dirham"],
  ["SAR", "riyal"],
  ["QAR", "riyal"],
  ["KWD", "dinar"],
  ["USD", "dollar"],
  ["CAD", "dollar"],
  ["AUD", "dollar"],
  ["EUR", "euro"],
  ["GBP", "pound"],
  ["EGP", "pound"],
  ["INR", "rupee"],
  ["JPY", "yen"],
  ["CNY", "yuan"],
  ["CHF", "franc"],
]);

export type LeftToPlanState = "some" | "zero" | "over";

export const leftToPlanState = (leftMinor: number): LeftToPlanState =>
  leftMinor > 0 ? "some" : leftMinor === 0 ? "zero" : "over";

/** The line under Left to plan on S4, per state. */
export function leftToPlanMessage(leftMinor: number, currency: string): string {
  switch (leftToPlanState(leftMinor)) {
    case "some":
      return `${moneyLabel(leftMinor, currency)} not planned yet. It counts as safe to spend.`;
    case "zero":
      return `Every ${UNIT_WORDS.get(currency) ?? "bit"} has a job ✓`;
    case "over":
      return `⚠︎ Planned ${moneyLabel(-leftMinor, currency)} more than you have`;
  }
}

/** S4 row hint: "Recurring · 450", else "Last month · 1,540", else none. */
export function itemHint(item: SetupItem, currency: string): string | undefined {
  if (item.recurringMinor) return `Recurring · ${figure(item.recurringMinor, currency)}`;
  if (item.lastPeriodMinor) return `Last month · ${figure(item.lastPeriodMinor, currency)}`;
  return undefined;
}

/** S5 foot of the receipt: "*** ≈ AED 142 A DAY UNTIL PAYDAY ***", in whole units. */
export const perDayNote = (perDayMinor: number, currency: string): string =>
  `*** ≈ ${currency} ${amountParts(Math.max(perDayMinor, 0), currency, "never").whole} A DAY UNTIL PAYDAY ***`;

/** S5: "Spending you already logged since 25 Sep is counted once, not twice." */
export const countedOnceLine = (periodStart: string): string =>
  `Spending you already logged since ${format(parseISO(periodStart), "d MMM")} is counted once, not twice.`;

const paydayPhrase = (rule: V2PaydayRule): string =>
  rule.kind === "last_workday" ? "on your last workday" : `on the ${paydayLabel(rule)}`;

/**
 * S5: what will remind the person. Bills that come from a Recurring rule get bill reminders;
 * the payday reminder is the person's S2 choice. Null when nothing reminds them.
 */
export function remindersLine(
  billReminders: number,
  paydayReminder: boolean,
  payday: V2PaydayRule,
): string | null {
  const bills = `${billReminders} bill ${billReminders === 1 ? "reminder" : "reminders"}`;
  if (billReminders > 0 && paydayReminder) {
    return `${bills}, plus a payday reminder ${paydayPhrase(payday)}. Nothing is paid for you.`;
  }
  if (billReminders > 0) return `${bills}. Nothing is paid for you.`;
  if (paydayReminder) return `A payday reminder ${paydayPhrase(payday)}. Nothing is paid for you.`;
  return null;
}

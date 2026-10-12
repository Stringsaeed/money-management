import type {
  V2Account,
  V2Category,
  V2RecurringRule,
  V2Transaction,
} from "@trove/api/v2/contracts";

export interface PaidBill {
  readonly id: string;
  readonly name: string;
  /** The Category's icon (emoji or Trove icon name), for the row's tile. */
  readonly icon: string | null;
  readonly accountName: string | null;
  readonly amountMinor: number;
  readonly currency: string;
  readonly date: string;
}

interface PaidInput {
  readonly transactions: readonly V2Transaction[];
  readonly rules: readonly V2RecurringRule[];
  readonly accounts: readonly V2Account[];
  readonly categories: readonly V2Category[];
  /** The current Budget Period. */
  readonly period: { readonly start: string; readonly end: string };
}

/**
 * Bills marked paid this period: the transactions a reminder (`remind`) rule posted, newest
 * first. Auto-posted rules are not on the Due list, so they are not listed here either.
 */
export function paidThisPeriod({
  transactions,
  rules,
  accounts,
  categories,
  period,
}: PaidInput): PaidBill[] {
  const reminders = new Map(
    rules.filter((rule) => rule.mode === "remind").map((rule) => [rule.id, rule]),
  );
  return transactions
    .filter(
      (transaction) =>
        transaction.kind !== "income" &&
        transaction.recurringRuleId !== null &&
        reminders.has(transaction.recurringRuleId) &&
        transaction.date >= period.start &&
        transaction.date <= period.end,
    )
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
    .map((transaction) => ({
      id: transaction.id,
      name: reminders.get(transaction.recurringRuleId ?? "")?.name ?? "Bill",
      icon: categories.find((category) => category.id === transaction.categoryId)?.icon ?? null,
      accountName: accounts.find((account) => account.id === transaction.accountId)?.name ?? null,
      amountMinor: transaction.amountMinor,
      currency: transaction.currency,
      date: transaction.date,
    }));
}

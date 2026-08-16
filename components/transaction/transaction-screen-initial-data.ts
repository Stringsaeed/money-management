import type { TransactionFormData } from "@/components/transaction/types";
import type { RecurringRule } from "@/modules/recurring-rules";
import type { Transaction } from "@/types";
import { parseDate } from "@/utils/date";

export function getTransactionScreenInitialData(
  rule: RecurringRule | null | undefined,
  transaction: Transaction | undefined,
): Partial<TransactionFormData> | undefined {
  if (rule) {
    return {
      type: rule.type,
      amount: rule.amountMinor ?? 0,
      accountId: rule.accountId ?? undefined,
      toAccountId: rule.toAccountId,
      categoryId: rule.categoryId,
      isRecurring: true,
      description: rule.description,
      date: parseDate(rule.startDate),
      currency: rule.currency,
      originalAmount: null,
      originalCurrency: null,
      exchangeRate: null,
      recurrence: {
        frequency: rule.frequency,
        intervalCount: rule.intervalCount,
        endDate: rule.endDate ? parseDate(rule.endDate) : null,
        endCount: rule.endCount,
      },
    };
  }
  if (!transaction) return undefined;
  return {
    type: transaction.type,
    amount: transaction.amount,
    accountId: transaction.accountId,
    toAccountId: transaction.toAccountId,
    categoryId: transaction.categoryId,
    isRecurring: transaction.isRecurring,
    description: transaction.description,
    date: new Date(transaction.date),
    currency: transaction.currency,
    originalAmount: transaction.originalAmount,
    originalCurrency: transaction.originalCurrency,
    exchangeRate: transaction.exchangeRate,
  };
}

import type { RecurringRuleDraft } from "@/modules/recurring-rules";
import type { Category } from "@/types";
import { toDateString } from "@/utils/date";

import type { TransactionFormData } from "../types";

const TYPE_LABEL = { income: "Income", expense: "Expense", transfer: "Transfer" } as const;

export function toRecurringRuleDraft(
  data: TransactionFormData,
  categories: Category[],
  timeZone: string,
): RecurringRuleDraft {
  const category = categories.find((candidate) => candidate.id === data.categoryId);
  return {
    name: data.description || category?.name || TYPE_LABEL[data.type],
    type: data.type,
    amountMinor: data.amount,
    currency: data.currency,
    accountId: data.accountId,
    toAccountId: data.toAccountId,
    categoryId: data.categoryId,
    description: data.description,
    frequency: data.recurrence.frequency,
    intervalCount: data.recurrence.intervalCount,
    startDate: toDateString(data.date),
    endDate: data.recurrence.endDate ? toDateString(data.recurrence.endDate) : null,
    endCount: data.recurrence.endCount,
    timeZone,
  };
}

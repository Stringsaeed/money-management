import type { Category, RecurringPayment } from "@/types";
import { toDateString } from "@/utils/date";

import type { TransactionFormData } from "../types";

export type NewRecurringPayment = Omit<RecurringPayment, "id" | "createdAt" | "updatedAt">;

const TYPE_LABEL = { income: "Income", expense: "Expense", transfer: "Transfer" } as const;

/** Maps submitted form data onto a recurring-payment rule (start date = `date`). */
export function toRecurringPayment(
  data: TransactionFormData,
  categories: Category[],
): NewRecurringPayment {
  const category = categories.find((c) => c.id === data.categoryId);
  const name = data.description || category?.name || TYPE_LABEL[data.type];

  return {
    name,
    type: data.type,
    amount: data.amount,
    currency: data.currency,
    accountId: data.accountId,
    toAccountId: data.toAccountId,
    categoryId: data.categoryId,
    description: data.description,
    frequency: data.recurrence.frequency,
    intervalCount: data.recurrence.intervalCount,
    dayOfMonth: null,
    dayOfWeek: null,
    monthOfYear: null,
    startDate: toDateString(data.date),
    endDate: data.recurrence.endDate ? toDateString(data.recurrence.endDate) : null,
    endCount: data.recurrence.endCount,
    lastGeneratedDate: null,
    isActive: true,
  };
}

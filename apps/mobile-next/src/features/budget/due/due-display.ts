import { format } from "date-fns";

import { amountParts } from "@/ui/trove";
import { parseDateKey } from "@/utils/date";

const formatKey = (date: string, pattern: string): string => {
  const parsed = parseDateKey(date);
  return parsed ? format(parsed, pattern) : date;
};

/** The Due header's stamp: "SUN 11.10.26". */
export const dueStamp = (today: string): string => formatKey(today, "EEE dd.MM.yy").toUpperCase();

/** When a pending bill (or the salary) is due: "SUN 18 OCT". */
export const dueWhen = (date: string): string => formatKey(date, "EEE d MMM").toUpperCase();

/** When a bill was paid: "1 OCT". */
export const paidWhen = (date: string): string => formatKey(date, "d MMM").toUpperCase();

/** "18th", for "cover before 18th". */
export const dayOrdinal = (date: string): string => formatKey(date, "do");

/** The payment's date on the detail rows: "Today, 11 Oct" or "Sat, 10 Oct". */
export function paymentDateLabel(date: string, today: string): string {
  return date === today ? `Today, ${formatKey(date, "d MMM")}` : formatKey(date, "EEE, d MMM");
}

/**
 * A bill's figure as the Due list prints it, without a sign: "1,850.00". A bill in another
 * currency than the budget's names its currency: "USD 50.00".
 */
export function dueFigure(minor: number, currency: string, budgetCurrency: string): string {
  const parts = amountParts(Math.abs(minor), currency, "never");
  const figure = `${parts.whole}${parts.fraction}`;
  return currency === budgetCurrency ? figure : `${currency} ${figure}`;
}

/** The Mark paid sheet's stamp: "Due today · SUN 11 OCT", "Overdue · was due SUN 4 OCT". */
export function markPaidStamp(
  item: { readonly scheduledDate: string; readonly overdue: boolean },
  today: string,
): string {
  const when = dueWhen(item.scheduledDate);
  if (item.overdue || item.scheduledDate < today) return `Overdue · was due ${when}`;
  if (item.scheduledDate === today) return `Due today · ${when}`;
  return `Due · ${when}`;
}

import { differenceInCalendarDays, format, isSameYear } from "date-fns";

import type { V2Account, V2Category, V2Transaction } from "@trove/api/v2/contracts";

import { amountAccessibilityLabel, amountParts } from "@/ui/trove";
import { parseDateKey } from "@/utils/date";

import { loggedTime } from "../../ledger/list/ledger-row-stamp";

/** `TODAY 08:12`, `YESTERDAY`, `THU 8 OCT`, or `THU 8 OCT 25` in another year. */
function datedLabel(transaction: V2Transaction, today: Date): string {
  const date = parseDateKey(transaction.date);
  if (!date) return transaction.date;
  const days = differenceInCalendarDays(today, date);
  const day =
    days === 0
      ? "Today"
      : days === 1
        ? "Yesterday"
        : format(date, isSameYear(date, today) ? "EEE d MMM" : "EEE d MMM yy");
  const time = loggedTime(transaction);
  return time ? `${day} ${time}` : day;
}

/**
 * The mono line under a spending row: `TODAY 08:12 · ENBD CARD`. Every row is in the envelope's
 * Categories, so the Category is left out.
 */
export function spendingRowMeta(
  transaction: V2Transaction,
  account: Pick<V2Account, "name"> | undefined,
  today: Date,
): string {
  return [datedLabel(transaction, today), transaction.recurringRuleId ? "Recurring" : account?.name]
    .filter(Boolean)
    .join(" · ")
    .toUpperCase();
}

/** A spending row's figure: unsigned, with its decimals (`214.30`); the section says it's spent. */
export function spendingFigure(transaction: Pick<V2Transaction, "amountMinor" | "currency">) {
  const parts = amountParts(transaction.amountMinor, transaction.currency, "never");
  return `${parts.whole}${parts.fraction}`;
}

export interface SpendingRowDisplay {
  readonly title: string;
  readonly meta: string;
  readonly figure: string;
  readonly amountLabel: string;
}

/** Title (the note, else the Category), stamp and figure of one expense in the envelope. */
export function spendingRowDisplay(
  transaction: V2Transaction,
  lookups: {
    readonly category?: Pick<V2Category, "name">;
    readonly account?: Pick<V2Account, "name">;
  },
  today: Date,
): SpendingRowDisplay {
  return {
    title: transaction.note.trim() || lookups.category?.name || "Spending",
    meta: spendingRowMeta(transaction, lookups.account, today),
    figure: spendingFigure(transaction),
    amountLabel: amountAccessibilityLabel(transaction.amountMinor, transaction.currency),
  };
}

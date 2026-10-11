import { format, isValid, parseISO } from "date-fns";

import type { V2Account, V2Category, V2Transaction } from "@trove/api/v2/contracts";

export interface LedgerRowStampLookups {
  readonly category?: V2Category;
  readonly account?: V2Account;
  readonly toAccount?: V2Account;
}

/**
 * Clock time the entry was logged, when it was logged on the day it is dated. A backdated entry
 * has no time of its own, so it prints none rather than the moment it was typed in.
 */
export function loggedTime(transaction: V2Transaction): string | null {
  const created = parseISO(transaction.createdAt);
  if (!isValid(created) || format(created, "yyyy-MM-dd") !== transaction.date) return null;
  return format(created, "HH:mm");
}

function categoryLabel(transaction: V2Transaction, category: V2Category | undefined): string {
  if (transaction.kind === "transfer") return "Transfer";
  return category?.name ?? (transaction.kind === "income" ? "Income" : "Uncategorised");
}

function sourceLabel(transaction: V2Transaction, lookups: LedgerRowStampLookups): string | null {
  if (transaction.recurringRuleId) return "Recurring";
  if (transaction.kind !== "transfer") return lookups.account?.name ?? null;
  const from = lookups.account?.name ?? "Account";
  return `${from} → ${lookups.toAccount?.name ?? "account"}`;
}

/** The mono line under a Ledger row: `08:12 · GROCERIES · ENBD CARD`. */
export function ledgerRowStamp(transaction: V2Transaction, lookups: LedgerRowStampLookups): string {
  return [
    loggedTime(transaction),
    categoryLabel(transaction, lookups.category),
    sourceLabel(transaction, lookups),
  ]
    .filter((part): part is string => Boolean(part))
    .join(" · ")
    .toUpperCase();
}

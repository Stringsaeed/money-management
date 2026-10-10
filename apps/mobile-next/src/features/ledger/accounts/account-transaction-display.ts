import type { V2Category, V2Transaction } from "@trove/api/v2/contracts";

import type { SignDisplay } from "@/ui/trove";

import { transactionTileIcon } from "../transactions/transaction-display";

export interface AccountTransactionDisplay {
  readonly title: string;
  readonly subtitle: string;
  /** Signed minor units: spending is negative, money in is positive. */
  readonly minor: number;
  readonly signDisplay: SignDisplay;
  /** The category's emoji, the transfer emoji, or the neutral Trove "other" icon. */
  readonly icon: string;
}

function titleFor(transaction: V2Transaction, category: V2Category | undefined): string {
  const note = transaction.note.trim();
  if (note) return note;
  return (transaction.kind === "transfer" ? "Transfer" : category?.name) || "Transaction";
}

/** Copy, signed amount and tile for one transaction row on an account's detail screen. */
export function accountTransactionDisplay(
  transaction: V2Transaction,
  category: V2Category | undefined,
): AccountTransactionDisplay {
  const isTransfer = transaction.kind === "transfer";
  const rowCategory = isTransfer ? undefined : category;

  return {
    title: titleFor(transaction, category),
    subtitle: rowCategory ? `${transaction.date} · ${rowCategory.name}` : transaction.date,
    minor: transaction.kind === "expense" ? -transaction.amountMinor : transaction.amountMinor,
    signDisplay: isTransfer ? "never" : "always",
    icon: transactionTileIcon(transaction.kind, rowCategory?.icon),
  };
}

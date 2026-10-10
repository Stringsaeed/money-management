import type { V2Category, V2Transaction } from "@trove/api/v2/contracts";

import { TransactionRow as TroveTransactionRow } from "@/ui/trove";

import { categoryEmoji, transactionTileIcon } from "./transaction-display";

interface TransactionRowProps {
  readonly transaction: V2Transaction;
  readonly category?: V2Category;
  readonly onPress?: (transaction: V2Transaction) => void;
}

/** Spending is negative minor units, money in positive; transfers show an unsigned amount. */
const signedMinor = (transaction: V2Transaction) =>
  transaction.kind === "expense" ? -transaction.amountMinor : transaction.amountMinor;

const rowIcon = (transaction: V2Transaction, category?: V2Category) =>
  transactionTileIcon(transaction.kind, category ? categoryEmoji(category.icon) : null);

export function TransactionRow({ transaction, category, onPress }: TransactionRowProps) {
  const title = transaction.note.trim() || category?.name || "Transaction";

  return (
    <TroveTransactionRow
      currency={transaction.currency}
      icon={rowIcon(transaction, category)}
      minor={signedMinor(transaction)}
      onPress={() => onPress?.(transaction)}
      signDisplay={transaction.kind === "transfer" ? "never" : "always"}
      subtitle={`${transaction.date}${category ? ` · ${category.name}` : ""}`}
      title={title}
    />
  );
}

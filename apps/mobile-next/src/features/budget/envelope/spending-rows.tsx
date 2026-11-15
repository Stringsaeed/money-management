import type { V2Transaction } from "@trove/api/v2/contracts";

import { spendingRowDisplay } from "./spending-display";
import { SpendingRow } from "./spending-row";
import type { EnvelopeSpending } from "./use-envelope-spending";

interface SpendingRowsProps {
  readonly transactions: readonly V2Transaction[];
  readonly spending: EnvelopeSpending;
  readonly onOpenTransaction: (transaction: V2Transaction) => void;
}

/** A short, unvirtualised run of spending rows: the three biggest spends behind an overspend. */
export function SpendingRows({ transactions, spending, onOpenTransaction }: SpendingRowsProps) {
  const today = new Date();
  return transactions.map((transaction) => (
    <SpendingRow
      key={transaction.id}
      display={spendingRowDisplay(
        transaction,
        {
          category: spending.categoriesById.get(transaction.categoryId ?? ""),
          account: spending.accountsById.get(transaction.accountId),
        },
        today,
      )}
      transaction={transaction}
      onPress={onOpenTransaction}
    />
  ));
}

import { format, parseISO } from "date-fns";
import type { V2Category, V2Transaction } from "@trove/api/v2/contracts";

import { ledgerRowDisplay } from "@/features/ledger/list/ledger-row-display";
import { TransactionRow } from "@/ui/trove";
import { signedMinor } from "./home-display";

interface HomeTransactionRowProps {
  readonly transaction: V2Transaction;
  readonly onPress?: (transaction: V2Transaction) => void;
  readonly category?: V2Category;
}

/** Latest-activity row: the Category's emoji on a neutral tile, same as the Ledger tab. */
export function HomeTransactionRow({ transaction, onPress, category }: HomeTransactionRowProps) {
  const display = ledgerRowDisplay(transaction, { category });
  const date = format(parseISO(transaction.date), "d MMM");

  return (
    <TransactionRow
      title={display.title}
      subtitle={display.meta ? `${date} · ${display.meta}` : date}
      minor={signedMinor(transaction.kind, transaction.amountMinor)}
      currency={transaction.currency}
      icon={display.tile}
      signDisplay={transaction.kind === "transfer" ? "never" : "always"}
      onPress={() => onPress?.(transaction)}
    />
  );
}

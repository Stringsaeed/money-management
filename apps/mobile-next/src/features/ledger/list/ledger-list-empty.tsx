import { format } from "date-fns";
import { StyleSheet, View } from "react-native";

import { EmptyState, layout, space } from "@/ui/trove";

import { LedgerEmptyReceipt } from "./ledger-empty-receipt";
import { plainAmount } from "./ledger-money";

interface LedgerListEmptyProps {
  readonly failed: boolean;
  readonly filtered: boolean;
  /** The ledger's first currency, to print the blank slip's total in. */
  readonly currency: string | null;
  readonly onRetry: () => void;
  readonly onClearFilters: () => void;
  readonly onAddTransaction?: () => void;
}

/** Failure, no-match, and first-run states for the Ledger list. */
export function LedgerListEmpty({
  failed,
  filtered,
  currency,
  onRetry,
  onClearFilters,
  onAddTransaction,
}: LedgerListEmptyProps) {
  if (!failed && !filtered) {
    const zero = currency ? `${currency} ${plainAmount(0, currency)}` : "0.00";
    return (
      <LedgerEmptyReceipt
        month={format(new Date(), "MMMM").toUpperCase()}
        onAddTransaction={onAddTransaction}
        total={zero}
      />
    );
  }
  return (
    <View style={styles.empty}>
      {failed ? (
        <EmptyState
          title="Ledger is unavailable"
          message="Check your connection and try again."
          actionLabel="Try again"
          onAction={onRetry}
        />
      ) : (
        <EmptyState
          icon="filter"
          title="Nothing matches"
          message="No entries fit every filter. Remove one to widen the list."
          actionLabel="Clear filters"
          onAction={onClearFilters}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { paddingHorizontal: layout.screenGutter, paddingTop: space[4] },
});

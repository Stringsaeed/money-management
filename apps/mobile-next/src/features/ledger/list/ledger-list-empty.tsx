import { StyleSheet, View } from "react-native";

import { EmptyState, layout, space } from "@/ui/trove";

import { LedgerListSkeleton } from "./ledger-list-skeleton";

interface LedgerListEmptyProps {
  readonly loading: boolean;
  readonly failed: boolean;
  readonly filtered: boolean;
  readonly onRetry: () => void;
  readonly onClearFilters: () => void;
  readonly onAddTransaction?: () => void;
}

/** Loading, failure, no-match, and first-run states for the Ledger list. */
export function LedgerListEmpty({
  loading,
  failed,
  filtered,
  onRetry,
  onClearFilters,
  onAddTransaction,
}: LedgerListEmptyProps) {
  if (loading) return <LedgerListSkeleton />;
  return (
    <View style={styles.empty}>
      {failed ? (
        <EmptyState
          title="Ledger is unavailable"
          message="Check your connection and try again."
          actionLabel="Try again"
          onAction={onRetry}
        />
      ) : filtered ? (
        <EmptyState
          icon="filter"
          title="Nothing matches"
          message="No entries fit every filter. Remove one to widen the list."
          actionLabel="Clear filters"
          onAction={onClearFilters}
        />
      ) : (
        <EmptyState
          icon="receipt"
          title="No transactions yet"
          message="Add your first entry and it will appear here."
          actionLabel={onAddTransaction ? "Add transaction" : undefined}
          onAction={onAddTransaction}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { paddingHorizontal: layout.screenGutter, paddingTop: space[4] },
});

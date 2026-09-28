import { ActivityIndicator, StyleSheet, View } from "react-native";

import { EmptyState } from "@/ui/empty-state";
import { Icon } from "@/ui/icon";
import { colors, spacing } from "@/ui/design-tokens";

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
  if (loading)
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.mutedForeground} accessibilityLabel="Loading ledger" />
      </View>
    );
  if (failed)
    return (
      <EmptyState
        title="Ledger is unavailable"
        message="Check your connection and try again."
        onRetry={onRetry}
      />
    );
  if (filtered)
    return (
      <EmptyState
        icon={<Icon name="funnel" size={28} color={colors.mutedForeground} />}
        title="Nothing matches"
        message="No entries fit every filter. Remove one to widen the list."
        action={{ label: "Clear filters", onPress: onClearFilters }}
      />
    );
  return (
    <EmptyState
      icon={<Icon name="receipt" size={28} color={colors.mutedForeground} />}
      title="No transactions yet"
      message="Add your first entry and it will appear here."
      action={
        onAddTransaction ? { label: "Add transaction", onPress: onAddTransaction } : undefined
      }
    />
  );
}

const styles = StyleSheet.create({
  loading: { alignItems: "center", paddingVertical: spacing[16] },
});

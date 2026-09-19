import { Pressable } from "react-native";

import { EmptyState } from "@/components/common/empty-state";
import { SproutLedgerGraphic } from "@/components/graphics/sprout-ledger";
import { Text } from "@/components/ui/text";

import { styles } from "./styles";
import type { HomeEmptyStateProps } from "./types";

export function HomeEmptyState({
  activeFilterCount,
  onResetFilters,
  compact,
}: HomeEmptyStateProps) {
  return (
    <EmptyState
      compact={compact}
      illustration={<SproutLedgerGraphic />}
      title="No transactions"
      message={
        activeFilterCount > 0
          ? "No transactions match the current filters."
          : "No transactions yet. Tap + Add Entry to get started."
      }
      action={
        activeFilterCount > 0 ? (
          <Pressable
            onPress={onResetFilters}
            style={[styles.emptyStateButton, { borderCurve: "continuous" }]}
          >
            <Text style={styles.emptyStateButtonText}>Reset Filters</Text>
          </Pressable>
        ) : undefined
      }
    />
  );
}

import { Pressable } from "react-native";

import { EmptyState } from "@/components/common/empty-state";
import { SproutLedgerGraphic } from "@/components/graphics/sprout-ledger";
import { Text } from "@/components/ui/text";

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
            className="mt-1 border border-ink px-5 py-2.5 active:bg-ink"
            style={{ borderCurve: "continuous" }}
          >
            <Text className="font-body-semibold text-[11px] uppercase tracking-wide text-ink">
              Reset Filters
            </Text>
          </Pressable>
        ) : undefined
      }
    />
  );
}

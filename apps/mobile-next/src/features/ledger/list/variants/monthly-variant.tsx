import { StyleSheet, View } from "react-native";

import { spacing } from "@/ui/design-tokens";

import { ActiveFilterBar } from "../active-filter-bar";
import { FilterButton } from "../filter-button";
import { KindSegments } from "../kind-segments";
import { LedgerManageLinks } from "../ledger-manage-links";
import { LedgerSummaryCard } from "../ledger-summary-card";
import { LEDGER_INSET, LedgerTransactionList } from "../ledger-transaction-list";
import { MonthNavigator } from "../month-navigator";
import type { LedgerVariantProps } from "./variant-props";

/**
 * E · Monthly — one month at a time, like closing the books. A month stepper drives the date
 * filter, the card totals that month, and entries are grouped by day.
 */
export function MonthlyVariant({
  list,
  navigation,
  onOpenTransaction,
  switcher,
}: LedgerVariantProps) {
  return (
    <LedgerTransactionList
      list={list}
      grouping="day"
      density="comfortable"
      onOpenTransaction={onOpenTransaction}
      onAddTransaction={navigation.onAddTransaction}
      header={
        <View style={styles.header}>
          {switcher}
          <MonthNavigator
            range={list.filters.range}
            onChange={(range) => list.update((current) => ({ ...current, range }))}
          />
          <LedgerSummaryCard
            summary={list.summary.data}
            caption={list.filters.range ? "This period" : "All time"}
          />
          <View style={styles.controls}>
            <View style={styles.segments}>
              <KindSegments
                kinds={list.filters.kinds}
                onChange={(kinds) => list.update((current) => ({ ...current, kinds }))}
              />
            </View>
            <FilterButton count={list.chips.length} onPress={list.openFilters} />
          </View>
          <ActiveFilterBar
            chips={list.chips}
            onRemove={list.remove}
            onClear={list.clear}
            inset={LEDGER_INSET}
          />
          <LedgerManageLinks navigation={navigation} appearance="inline" />
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing[4], paddingTop: spacing[2] },
  controls: { alignItems: "center", flexDirection: "row", gap: spacing[2] },
  segments: { flex: 1 },
});

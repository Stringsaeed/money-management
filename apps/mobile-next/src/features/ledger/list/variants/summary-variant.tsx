import { StyleSheet, View } from "react-native";

import { spacing } from "@/ui/design-tokens";

import { ActiveFilterBar } from "../active-filter-bar";
import { FilterButton } from "../filter-button";
import { KindSegments } from "../kind-segments";
import { LedgerManageLinks } from "../ledger-manage-links";
import { LedgerSummaryCard } from "../ledger-summary-card";
import { LedgerTitle } from "../ledger-title";
import { LEDGER_INSET, LedgerTransactionList } from "../ledger-transaction-list";
import type { LedgerVariantProps } from "./variant-props";

/**
 * B · Summary — totals first. A card with net, money in and out for whatever is filtered, a
 * kind switch, then entries grouped by month so long histories scan quickly.
 */
export function SummaryVariant({
  list,
  navigation,
  onOpenTransaction,
  switcher,
}: LedgerVariantProps) {
  return (
    <LedgerTransactionList
      list={list}
      grouping="month"
      density="comfortable"
      onOpenTransaction={onOpenTransaction}
      onAddTransaction={navigation.onAddTransaction}
      header={
        <View style={styles.header}>
          {switcher}
          <LedgerTitle
            accessory={
              <FilterButton
                count={list.chips.length}
                onPress={list.openFilters}
                appearance="pill"
              />
            }
          />
          <LedgerSummaryCard
            summary={list.summary.data}
            caption={list.filters.range?.label ?? (list.chips.length > 0 ? "Filtered" : "All time")}
          />
          <KindSegments
            kinds={list.filters.kinds}
            onChange={(kinds) => list.update((current) => ({ ...current, kinds }))}
          />
          <ActiveFilterBar
            chips={list.chips}
            onRemove={list.remove}
            onClear={list.clear}
            inset={LEDGER_INSET}
          />
          <LedgerManageLinks navigation={navigation} appearance="tiles" />
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing[4], paddingTop: spacing[2] },
});

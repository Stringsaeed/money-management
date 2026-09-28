import { StyleSheet, View } from "react-native";

import { IconButton } from "@/ui/icon-button";
import { spacing } from "@/ui/design-tokens";

import { ActiveFilterBar } from "../active-filter-bar";
import { FilterButton } from "../filter-button";
import { ledgerCountCaption } from "../ledger-count-caption";
import { LedgerManageLinks } from "../ledger-manage-links";
import { LedgerSearchField } from "../ledger-search-field";
import { LedgerTitle } from "../ledger-title";
import { LEDGER_INSET, LedgerTransactionList } from "../ledger-transaction-list";
import type { LedgerVariantProps } from "./variant-props";

/**
 * A · Journal — search-first. Title with a running count, a search bar paired with the filter
 * button, applied filters beneath, then entries grouped by day.
 */
export function JournalVariant({
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
          <LedgerTitle
            caption={ledgerCountCaption(list.summary.data)}
            accessory={
              <IconButton
                name="plus"
                variant="primary"
                accessibilityLabel="Add transaction"
                onPress={navigation.onAddTransaction}
              />
            }
          />
          <View style={styles.searchRow}>
            <LedgerSearchField
              value={list.filters.search}
              onSubmit={(search) => list.update((current) => ({ ...current, search }))}
            />
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
  searchRow: { alignItems: "center", flexDirection: "row", gap: spacing[2] },
});

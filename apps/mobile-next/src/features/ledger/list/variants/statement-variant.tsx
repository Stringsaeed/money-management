import { StyleSheet, View } from "react-native";

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
 * D · Statement — maximum density for long histories. Bank-statement lines with a date
 * column, bold month rules carrying the month's net, search and filter in one toolbar.
 */
export function StatementVariant({
  list,
  navigation,
  onOpenTransaction,
  switcher,
}: LedgerVariantProps) {
  return (
    <LedgerTransactionList
      list={list}
      grouping="month"
      density="statement"
      onOpenTransaction={onOpenTransaction}
      onAddTransaction={navigation.onAddTransaction}
      header={
        <View style={styles.header}>
          {switcher}
          <LedgerTitle title="Statement" caption={ledgerCountCaption(list.summary.data)} />
          <LedgerManageLinks navigation={navigation} appearance="inline" />
          <View style={styles.toolbar}>
            <LedgerSearchField
              value={list.filters.search}
              onSubmit={(search) => list.update((current) => ({ ...current, search }))}
              placeholder="Search statement"
            />
            <FilterButton count={list.chips.length} onPress={list.openFilters} />
          </View>
          <ActiveFilterBar
            chips={list.chips}
            onRemove={list.remove}
            onClear={list.clear}
            inset={LEDGER_INSET}
          />
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing[3], paddingTop: spacing[2] },
  toolbar: { alignItems: "center", flexDirection: "row", gap: spacing[2] },
});

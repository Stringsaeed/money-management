import { StyleSheet, View } from "react-native";

import { Text } from "@/ui/text";
import { spacing } from "@/ui/design-tokens";

import { AccountStrip } from "../account-strip";
import { ActiveFilterBar } from "../active-filter-bar";
import { FilterButton } from "../filter-button";
import { ledgerCountCaption } from "../ledger-count-caption";
import { toggleValue } from "../ledger-filters";
import { LedgerTitle } from "../ledger-title";
import { LEDGER_INSET, LedgerTransactionList } from "../ledger-transaction-list";
import { TextLink } from "../text-link";
import type { LedgerVariantProps } from "./variant-props";

/**
 * C · Accounts — money lives in accounts. Balance cards lead and double as the account filter;
 * everything else sits behind the filter button. Entries grouped by day.
 */
export function AccountsVariant({
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
            accessory={<FilterButton count={list.chips.length} onPress={list.openFilters} />}
          />
          <View style={styles.sectionRow}>
            <Text variant="label">Accounts</Text>
            <View style={styles.links}>
              <TextLink label="Categories" onPress={navigation.onOpenCategories} />
              <TextLink label="Recurring" onPress={navigation.onOpenRecurring} />
              <TextLink label="Manage" onPress={navigation.onOpenAccounts} />
            </View>
          </View>
          <AccountStrip
            accounts={list.accounts}
            selectedIds={list.filters.accountIds}
            onToggle={(id) =>
              list.update((current) => ({
                ...current,
                accountIds: toggleValue(current.accountIds, id),
              }))
            }
            onAdd={navigation.onOpenAccounts}
            inset={LEDGER_INSET}
          />
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
  header: { gap: spacing[4], paddingTop: spacing[2] },
  sectionRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  links: { flexDirection: "row", gap: spacing[4] },
});

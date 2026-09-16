import { ActivityIndicator, StyleSheet, View } from "react-native";

import { HomeEmptyState } from "@/components/home/home-empty-state";
import { HomeJournalList } from "@/components/home/home-journal-list";
import { LedgerListHeader } from "@/components/ledger/ledger-list-header";
import { useHomeScreen } from "@/hooks/use-home-screen";
import { colors, spacing } from "@/lib/design-tokens";

export default function LedgerScreen() {
  const { loadingTx, groups, currency, activeFilterCount, activeAccountId, resetFilters } =
    useHomeScreen();

  const showAccount = activeAccountId === null;

  const listHeader = <LedgerListHeader />;

  return (
    <View style={styles.screen}>
      {loadingTx ? (
        <>
          {listHeader}
          <ActivityIndicator style={styles.loader} />
        </>
      ) : groups.length === 0 ? (
        <>
          {listHeader}
          <HomeEmptyState activeFilterCount={activeFilterCount} onResetFilters={resetFilters} />
        </>
      ) : (
        <HomeJournalList
          groups={groups}
          currency={currency}
          showAccount={showAccount}
          ListHeaderComponent={listHeader}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loader: {
    marginTop: spacing[10],
  },
});

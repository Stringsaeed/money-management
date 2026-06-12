import { ActivityIndicator, View } from "react-native";

import { HomeEmptyState } from "@/components/home/home-empty-state";
import { HomeJournalList } from "@/components/home/home-journal-list";
import { LedgerListHeader } from "@/components/ledger/ledger-list-header";
import { useHomeScreen } from "@/hooks/use-home-screen";

export default function LedgerScreen() {
  const { loadingTx, groups, currency, activeFilterCount, activeAccountId, resetFilters } =
    useHomeScreen();

  const showAccount = activeAccountId === null;

  const listHeader = <LedgerListHeader />;

  return (
    <View className="flex-1 bg-background">
      {loadingTx ? (
        <>
          {listHeader}
          <ActivityIndicator className="mt-10" />
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

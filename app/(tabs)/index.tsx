import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { HomeEmptyState } from "@/components/home/home-empty-state";
import { HomeJournalList } from "@/components/home/home-journal-list";
import { HomeListHeader } from "@/components/home/home-list-header";
import { useHomeScreen } from "@/hooks/use-home-screen";

export default function HomeScreen() {
  const {
    loadingAccounts,
    loadingTx,
    groups,
    currency,
    activeFilterCount,
    activeAccountId,
    accounts,
    resetFilters,
  } = useHomeScreen({ limit: 10 });

  const showAccount = activeAccountId === null;

  if (!loadingAccounts && accounts.length === 0) {
    return <Redirect href="/onboarding" />;
  }

  const listHeader = <HomeListHeader />;

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

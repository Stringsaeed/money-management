import { Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { HomeEmptyState } from "@/components/home/home-empty-state";
import { HomeJournalList } from "@/components/home/home-journal-list";
import { LedgerListHeader } from "@/components/ledger/ledger-list-header";
import { useHomeScreen } from "@/hooks/use-home-screen";
import { useLedgerHeaderItems } from "@/utils/ledger-header-items";

export default function LedgerScreen() {
  const { loadingTx, groups, currency, activeFilterCount, activeAccountId, resetFilters } =
    useHomeScreen();

  const showAccount = activeAccountId === null;

  const { headerRightItems } = useLedgerHeaderItems();

  const listHeader = <LedgerListHeader />;

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{
          title: "Ledger",
          headerBackButtonDisplayMode: "minimal",
          unstable_headerRightItems: () => headerRightItems,
        }}
      />
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

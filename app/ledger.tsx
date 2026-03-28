import { Stack, useRouter } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { HomeEmptyState } from "@/components/home/home-empty-state";
import { HomeJournalList } from "@/components/home/home-journal-list";
import { LedgerListHeader } from "@/components/ledger/ledger-list-header";
import { useHomeScreen } from "@/hooks/use-home-screen";
import { buildLedgerHeaderItems } from "@/utils/ledger-header-items";

export default function LedgerScreen() {
  const router = useRouter();
  const {
    accounts,
    allCategories,
    dateRange,
    loadingTx,
    groups,
    currency,
    activeFilterCount,
    activeAccount,
    activeCategory,
    selectedYear,
    selectedMonth,
    activeAccountId,
    selectedCategoryId,
    setSelectedMonth,
    setActiveAccountId,
    setSelectedCategoryId,
    resetFilters,
  } = useHomeScreen();

  const showAccount = activeAccountId === null;

  const { headerRightItems } = buildLedgerHeaderItems({
    router,
    accounts,
    allCategories,
    dateRange,
    activeAccountId,
    selectedYear,
    selectedMonth,
    selectedCategoryId,
    activeFilterCount,
    setActiveAccountId,
    setSelectedMonth,
    setSelectedCategoryId,
    resetFilters,
  });

  const listHeader = (
    <LedgerListHeader
      activeAccountName={activeAccount?.name ?? null}
      selectedYear={selectedYear}
      selectedMonth={selectedMonth}
      selectedCategoryName={activeCategory?.name ?? null}
      setActiveAccountId={setActiveAccountId}
      setSelectedMonth={setSelectedMonth}
      setSelectedCategoryId={setSelectedCategoryId}
    />
  );

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

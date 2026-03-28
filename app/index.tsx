import { Redirect, Stack, useRouter } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, View } from "react-native";

import { HomeEmptyState } from "@/components/home/home-empty-state";
import { HomeJournalList } from "@/components/home/home-journal-list";
import { HomeListHeader } from "@/components/home/home-list-header";
import { useHomeInsights } from "@/hooks/use-home-insights";
import { useHomeScreen } from "@/hooks/use-home-screen";
import { buildHomeHeaderItems } from "@/utils/home-header-items";

export default function HomeScreen() {
  const router = useRouter();
  const {
    accounts,
    allCategories,
    dateRange,
    loadingAccounts,
    loadingTx,
    groups,
    currency,
    activeFilterCount,
    activeAccount,
    activeCategory,
    summary,
    selectedYear,
    selectedMonth,
    activeAccountId,
    selectedCategoryId,
    setSelectedMonth,
    setActiveAccountId,
    setSelectedCategoryId,
    resetFilters,
  } = useHomeScreen();

  const { filteredBalance, categorySpending, monthlyTrend } = useHomeInsights({
    accounts,
    groups,
    activeFilterCount,
  });

  const showAccount = activeAccountId === null;

  const { headerLeftItems, headerRightItems } = useMemo(
    () =>
      buildHomeHeaderItems({
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
      }),
    [
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
    ],
  );

  if (!loadingAccounts && accounts.length === 0) {
    return <Redirect href="/onboarding" />;
  }

  const listHeader = (
    <HomeListHeader
      activeAccountName={activeAccount?.name ?? null}
      selectedYear={selectedYear}
      selectedMonth={selectedMonth}
      selectedCategoryName={activeCategory?.name ?? null}
      summary={summary}
      currency={currency}
      filteredBalance={filteredBalance}
      categorySpending={categorySpending}
      monthlyTrend={monthlyTrend}
      setActiveAccountId={setActiveAccountId}
      setSelectedMonth={setSelectedMonth}
      setSelectedCategoryId={setSelectedCategoryId}
    />
  );

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{
          unstable_headerLeftItems: () => headerLeftItems,
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

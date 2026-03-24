import { Redirect } from "expo-router";
import { ActivityIndicator, Pressable, SectionList, View } from "react-native";

import { EmptyState } from "@/components/common/empty-state";
import { AccountsSection } from "@/components/home/accounts-section";
import { BalanceHero } from "@/components/home/balance-hero";
import { FilterBar } from "@/components/home/filter-bar";
import { JournalHeader } from "@/components/home/journal-header";
import { TransactionGroup } from "@/components/transaction/transaction-group";
import { Text } from "@/components/ui/text";
import { useHomeScreen } from "@/hooks/use-home-screen";

export default function HomeScreen() {
  const {
    accounts,
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
    setSelectedMonth,
    setActiveAccountId,
    setSelectedCategoryId,
    resetFilters,
  } = useHomeScreen();

  if (!loadingAccounts && accounts.length === 0) {
    return <Redirect href="/onboarding" />;
  }

  const ListHeader = (
    <>
      <BalanceHero accounts={accounts} activeFilterCount={activeFilterCount} />
      <AccountsSection accounts={accounts} />
      <FilterBar
        activeAccountName={activeAccount?.name ?? null}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        selectedCategoryName={activeCategory?.name ?? null}
        summary={summary}
        currency={currency}
        setActiveAccountId={setActiveAccountId}
        setSelectedMonth={setSelectedMonth}
        setSelectedCategoryId={setSelectedCategoryId}
      />
      <JournalHeader />
    </>
  );

  return (
    <View className="flex-1 bg-background">
      {loadingTx ? (
        <>
          {ListHeader}
          <ActivityIndicator className="mt-10" />
        </>
      ) : groups.length === 0 ? (
        <>
          {ListHeader}
          <EmptyState
            icon="📋"
            title="No transactions"
            message={
              activeFilterCount > 0
                ? "No transactions match the current filters."
                : "No transactions yet. Tap + Add Entry to get started."
            }
            action={
              activeFilterCount > 0 ? (
                <Pressable
                  onPress={resetFilters}
                  className="mt-1 px-5 py-2.5 border border-ink active:bg-ink"
                  style={{ borderCurve: "continuous" }}
                >
                  <Text className="font-body-semibold text-[11px] text-ink uppercase tracking-wide">
                    Reset Filters
                  </Text>
                </Pressable>
              ) : undefined
            }
          />
        </>
      ) : (
        <SectionList
          sections={groups.map((g) => ({ title: g.date, data: [g] }))}
          keyExtractor={(item) => item.date}
          renderItem={({ item }) => (
            <TransactionGroup
              group={item}
              currency={currency}
              showAccount={activeAccountId === null}
            />
          )}
          renderSectionHeader={() => null}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={{ paddingBottom: 112 }}
          stickySectionHeadersEnabled={false}
        />
      )}
    </View>
  );
}

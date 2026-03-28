import { View } from "react-native";

import { StatsCharts } from "@/components/settings/stats-charts";

import { BalanceHero } from "./balance-hero";
import { FilterBar } from "./filter-bar";
import { JournalHeader } from "./journal-header";
import type { HomeListHeaderProps } from "./types";

export function HomeListHeader({
  activeAccountName,
  selectedYear,
  selectedMonth,
  selectedCategoryName,
  summary,
  currency,
  filteredBalance,
  categorySpending,
  monthlyTrend,
  setActiveAccountId,
  setSelectedMonth,
  setSelectedCategoryId,
}: HomeListHeaderProps) {
  return (
    <View className="pt-safe-offset-20">
      <FilterBar
        activeAccountName={activeAccountName}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        selectedCategoryName={selectedCategoryName}
        summary={summary}
        currency={currency}
        setActiveAccountId={setActiveAccountId}
        setSelectedMonth={setSelectedMonth}
        setSelectedCategoryId={setSelectedCategoryId}
      />
      <BalanceHero balanceCents={filteredBalance} currency={currency} />
      <StatsCharts categorySpending={categorySpending} monthlyTrend={monthlyTrend} />
      <JournalHeader />
    </View>
  );
}

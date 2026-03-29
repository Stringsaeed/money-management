import { View } from "react-native";

import { StatsCharts } from "@/components/settings/stats-charts";

import { BalanceHero } from "./balance-hero";
import { FilterBar } from "./filter-bar";
import { JournalHeader } from "./journal-header";

export function HomeListHeader() {
  return (
    <View className="pt-safe-offset-20">
      <FilterBar />
      <BalanceHero />
      <StatsCharts />
      <JournalHeader />
    </View>
  );
}

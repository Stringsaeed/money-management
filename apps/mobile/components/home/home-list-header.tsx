import { View } from "react-native";

import { BalanceHero } from "@/components/home/balance-hero";
import { FilterBar } from "@/components/home/filter-bar";
import { UpcomingRecurringSection } from "@/components/home/upcoming-recurring-section";

export function HomeListHeader() {
  return (
    <View>
      <FilterBar />
      <BalanceHero />
      <UpcomingRecurringSection />
    </View>
  );
}

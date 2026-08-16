import { View } from "react-native";

import { BalanceHero } from "./balance-hero";
import { FilterBar } from "./filter-bar";
import { UpcomingRecurringSection } from "./upcoming-recurring-section";

export function HomeListHeader() {
  return (
    <View>
      <FilterBar />
      <BalanceHero />
      <UpcomingRecurringSection />
    </View>
  );
}

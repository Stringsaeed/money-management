import { View } from "react-native";

import { BalanceHero } from "./balance-hero";
import { FilterBar } from "./filter-bar";
import { JournalHeader } from "./journal-header";
import { UpcomingRecurringSection } from "./upcoming-recurring-section";

export function HomeListHeader() {
  return (
    <View className="pt-safe-offset-20">
      <FilterBar />
      <BalanceHero />
      <UpcomingRecurringSection />
      <JournalHeader />
    </View>
  );
}

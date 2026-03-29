import { View } from "react-native";

import { FilterBar } from "@/components/home/filter-bar";
import { JournalHeader } from "@/components/home/journal-header";

export function LedgerListHeader() {
  return (
    <View className="pt-safe-offset-20">
      <FilterBar />
      <JournalHeader />
    </View>
  );
}

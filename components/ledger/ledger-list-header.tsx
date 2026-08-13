import { View } from "react-native";

import { FilterBar } from "@/components/home/filter-bar";

export function LedgerListHeader() {
  return (
    <View className="pt-safe-offset-20">
      <FilterBar />
    </View>
  );
}

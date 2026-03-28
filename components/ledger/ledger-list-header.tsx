import { View } from "react-native";

import { FilterBar } from "@/components/home/filter-bar";
import type { FilterBarProps } from "@/components/home/types";

export function LedgerListHeader({
  activeAccountName,
  selectedYear,
  selectedMonth,
  selectedCategoryName,
  setActiveAccountId,
  setSelectedMonth,
  setSelectedCategoryId,
}: FilterBarProps) {
  return (
    <View className="pt-safe-offset-20">
      <FilterBar
        activeAccountName={activeAccountName}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        selectedCategoryName={selectedCategoryName}
        setActiveAccountId={setActiveAccountId}
        setSelectedMonth={setSelectedMonth}
        setSelectedCategoryId={setSelectedCategoryId}
      />
    </View>
  );
}

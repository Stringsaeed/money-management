import { ScrollView } from "react-native";

import { formatMonth } from "@/utils/date";

import { FilterChip } from "./filter-chip";
import type { FilterBarProps } from "./types";

export function FilterBar({
  activeAccountName,
  selectedYear,
  selectedMonth,
  selectedCategoryName,
  setActiveAccountId,
  setSelectedMonth,
  setSelectedCategoryId,
}: FilterBarProps) {
  const hasChips = !!(activeAccountName || selectedMonth || selectedCategoryName);

  if (!hasChips) return null;

  return (
    <ScrollView
      horizontal
      className="bg-background"
      contentContainerClassName="px-5 gap-2 pb-3"
      showsHorizontalScrollIndicator={false}
    >
      {activeAccountName && (
        <FilterChip label={activeAccountName} onRemove={() => setActiveAccountId(null)} />
      )}
      {selectedYear && selectedMonth && (
        <FilterChip
          label={formatMonth(selectedYear, selectedMonth)}
          onRemove={() => setSelectedMonth(null, null)}
        />
      )}
      {selectedCategoryName && (
        <FilterChip label={selectedCategoryName} onRemove={() => setSelectedCategoryId(null)} />
      )}
    </ScrollView>
  );
}

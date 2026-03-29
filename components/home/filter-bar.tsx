import { ScrollView } from "react-native";

import { useAccountsWithBalances } from "@/hooks/use-accounts";
import { useCategories } from "@/hooks/use-categories";
import { useUIStore } from "@/stores/ui-store";
import { formatMonth } from "@/utils/date";

import { FilterChip } from "./filter-chip";

export function FilterBar() {
  const {
    selectedYear,
    selectedMonth,
    activeAccountId,
    selectedCategoryId,
    setActiveAccountId,
    setSelectedMonth,
    setSelectedCategoryId,
  } = useUIStore();

  const { data: accounts = [] } = useAccountsWithBalances();
  const { data: categories = [] } = useCategories();

  const activeAccountName = accounts.find((a) => a.id === activeAccountId)?.name ?? null;
  const selectedCategoryName = categories.find((c) => c.id === selectedCategoryId)?.name ?? null;

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

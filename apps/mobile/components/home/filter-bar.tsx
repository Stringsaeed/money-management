import { ScrollView } from "react-native";

import { useAccountsWithBalances } from "@/hooks/use-accounts";
import { useAllCategories } from "@/hooks/use-categories";
import { useUIStore } from "@/stores/ui-store";
import { formatMonth } from "@/utils/date";

import { FilterChip } from "./filter-chip";
import { styles } from "./styles";

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
  const { data: categories = [] } = useAllCategories();

  const activeAccountName = accounts.find((a) => a.id === activeAccountId)?.name ?? null;
  const selectedCategoryName = categories.find((c) => c.id === selectedCategoryId)?.name ?? null;

  const hasChips = !!(activeAccountName || selectedMonth || selectedCategoryName);

  if (!hasChips) return null;

  return (
    <ScrollView
      horizontal
      contentContainerStyle={styles.filterBarContent}
      showsHorizontalScrollIndicator={false}
      style={styles.filterBarScroll}
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

import { ScrollView, StyleSheet } from "react-native";

import { layout, space } from "@/ui/trove";

import { dateChipLabel } from "./search-model";
import { SearchFilterChip } from "./search-filter-chip";
import type { LedgerSearchModel } from "./use-ledger-search";

interface SearchFiltersProps {
  readonly search: LedgerSearchModel;
}

/** Date, account, category and recurring chips: one row that scrolls past the gutter. */
export function SearchFilters({ search }: SearchFiltersProps) {
  const { state } = search;
  const date = dateChipLabel(state.date, search.today);
  const account = state.accountId ? search.accountById.get(state.accountId) : undefined;
  const category = state.categoryId ? search.categoryById.get(state.categoryId) : undefined;
  return (
    <ScrollView
      accessibilityLabel="Filters"
      contentContainerStyle={styles.row}
      horizontal
      keyboardShouldPersistTaps="handled"
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
    >
      <SearchFilterChip
        accessibilityLabel={`Date: ${date}`}
        icon="calendar"
        label={date}
        on={state.date !== "any"}
        onPress={() => search.openSheet("date")}
        tail="menu"
      />
      <SearchFilterChip
        accessibilityLabel={`Account: ${account?.name ?? "all accounts"}`}
        icon="bank"
        label={account?.name ?? "All accounts"}
        on={Boolean(account)}
        onPress={() => search.openSheet("account")}
        tail="menu"
      />
      {category ? (
        <SearchFilterChip
          accessibilityLabel={`Category: ${category.name}. Remove`}
          emoji={category.icon || undefined}
          icon="category"
          label={category.name}
          on
          onPress={() => search.update({ categoryId: null })}
          tail="remove"
        />
      ) : (
        <SearchFilterChip
          accessibilityLabel="Category: all categories"
          icon="category"
          label="Category"
          on={false}
          onPress={() => search.openSheet("category")}
          tail="menu"
        />
      )}
      <SearchFilterChip
        accessibilityLabel="Recurring only"
        icon="recurring"
        label="Recurring"
        on={state.recurring}
        onPress={() => search.update({ recurring: !state.recurring })}
        tail={null}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0, marginHorizontal: -layout.screenGutter },
  row: { gap: space[2], paddingHorizontal: layout.screenGutter },
});

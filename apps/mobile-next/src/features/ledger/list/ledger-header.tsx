import { StyleSheet, View } from "react-native";
// oxlint-disable-next-line no-restricted-imports -- Only the SharedValue type, owned by the scroll-driven reveal.
import type { SharedValue } from "react-native-reanimated";

import { colors, FilterButton, Header, layout, space } from "@/ui/trove";

import { ActiveFilterBar } from "./active-filter-bar";
import { CollapsibleRow } from "./collapsible-row";
import { LedgerSearchField } from "./ledger-search-field";
import type { LedgerListModel } from "./use-ledger-list";

interface LedgerHeaderProps {
  readonly list: LedgerListModel;
  readonly searchHidden: SharedValue<number>;
}

/**
 * Pinned above the list: title with the filter action, the search bar (which tucks away while
 * scrolling down), and the applied filters.
 */
export function LedgerHeader({ list, searchHidden }: LedgerHeaderProps) {
  const applied = list.chips.length;
  return (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <View style={styles.title}>
          <Header title="Ledger" />
        </View>
        <FilterButton
          active={applied > 0}
          count={applied}
          label="Filters"
          onPress={list.openFilters}
        />
      </View>
      <CollapsibleRow hidden={searchHidden}>
        <View style={styles.search}>
          <LedgerSearchField
            value={list.filters.search}
            onSubmit={(search) => list.update((current) => ({ ...current, search }))}
          />
        </View>
      </CollapsibleRow>
      {applied > 0 ? (
        <View style={styles.chips}>
          <ActiveFilterBar chips={list.chips} onRemove={list.remove} onClear={list.clear} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: { alignItems: "center", flexDirection: "row", gap: space[3] },
  title: { flex: 1 },
  header: {
    backgroundColor: colors.bg.canvas,
    borderBottomColor: colors.border.subtle,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: space[3],
    paddingHorizontal: layout.screenGutter,
    paddingTop: space[2],
  },
  // Spacing lives inside the collapsible row so it collapses along with the field.
  search: { paddingTop: space[3] },
  chips: { paddingTop: space[3] },
});

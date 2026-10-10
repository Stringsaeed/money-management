import { StyleSheet, View } from "react-native";
// oxlint-disable-next-line no-restricted-imports -- Only the SharedValue type, owned by the scroll-driven reveal.
import type { SharedValue } from "react-native-reanimated";

import { colors, Header, layout, space } from "@/ui/trove";

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
      <Header
        title="Ledger"
        actions={[
          {
            icon: "filter",
            label: applied > 0 ? `Filters, ${applied} applied` : "Filters",
            onPress: list.openFilters,
          },
        ]}
      />
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

import { StyleSheet, View } from "react-native";
// oxlint-disable-next-line no-restricted-imports -- Only the SharedValue type, owned by the scroll-driven reveal.
import type { SharedValue } from "react-native-reanimated";

import { colors, spacing } from "@/ui/design-tokens";

import { ActiveFilterBar } from "./active-filter-bar";
import { CollapsibleRow } from "./collapsible-row";
import { FilterButton } from "./filter-button";
import { ledgerCountCaption } from "./ledger-count-caption";
import { LedgerSearchField } from "./ledger-search-field";
import { LedgerTitle } from "./ledger-title";
import type { LedgerListModel } from "./use-ledger-list";

export const LEDGER_INSET = spacing[5];

interface LedgerHeaderProps {
  readonly list: LedgerListModel;
  readonly searchHidden: SharedValue<number>;
}

/**
 * Pinned above the list: title with the filter button, the search bar (which tucks away while
 * scrolling down), and the applied filters.
 */
export function LedgerHeader({ list, searchHidden }: LedgerHeaderProps) {
  return (
    <View style={styles.header}>
      <LedgerTitle
        caption={ledgerCountCaption(list.summary.data)}
        accessory={<FilterButton count={list.chips.length} onPress={list.openFilters} />}
      />
      <CollapsibleRow hidden={searchHidden}>
        <View style={styles.search}>
          <LedgerSearchField
            value={list.filters.search}
            onSubmit={(search) => list.update((current) => ({ ...current, search }))}
          />
        </View>
      </CollapsibleRow>
      {list.chips.length > 0 ? (
        <View style={styles.chips}>
          <ActiveFilterBar
            chips={list.chips}
            onRemove={list.remove}
            onClear={list.clear}
            inset={LEDGER_INSET}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.background,
    borderBottomColor: colors.ledgerOutline,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: spacing[3],
    paddingHorizontal: LEDGER_INSET,
    paddingTop: spacing[2],
  },
  // Spacing lives inside the collapsible row so it collapses along with the field.
  search: { flexDirection: "row", paddingTop: spacing[3] },
  chips: { paddingTop: spacing[3] },
});

import { StyleSheet, View } from "react-native";

import { layout, space } from "@/ui/trove";

import { ActiveFilterBar } from "./active-filter-bar";
import { LEDGER_HEADER_FOOT } from "./ledger-header";
import { LedgerSearchPill } from "./ledger-search-pill";
import { LedgerShortcuts, type LedgerNavigation } from "./ledger-shortcuts";
import { LedgerTotalsCard } from "./ledger-totals-card";
import { primaryTotals } from "./ledger-totals";
import type { LedgerListModel } from "./use-ledger-list";

interface LedgerListHeaderProps {
  readonly list: LedgerListModel;
  readonly navigation: LedgerNavigation;
  /** Entries are listed below: the IN and OUT card shows above them. */
  readonly showTotals: boolean;
}

/** Board rhythm: 16pt between the search pill, the shortcuts, the totals, and the first day. */
const GAP = space[4];

/** Scrolls away above the days: search, shortcuts, applied filters, and the period's totals. */
export function LedgerListHeader({ list, navigation, showTotals }: LedgerListHeaderProps) {
  return (
    <View style={styles.stack}>
      <LedgerSearchPill
        onSubmit={(search) => list.update((current) => ({ ...current, search }))}
        value={list.filters.search}
      />
      <LedgerShortcuts navigation={navigation} />
      {list.chips.length > 0 ? (
        <ActiveFilterBar chips={list.chips} onClear={list.clear} onRemove={list.remove} />
      ) : null}
      {showTotals ? (
        <LedgerTotalsCard
          label={list.totals.period.label}
          totals={primaryTotals(list.totals.summary.data)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: GAP,
    paddingBottom: GAP,
    paddingHorizontal: layout.screenGutter,
    paddingTop: GAP - LEDGER_HEADER_FOOT,
  },
});

import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { V2Transaction } from "@trove/api/v2/contracts";

import { layout, Screen } from "@/ui/trove";

import { SearchBar } from "./search-bar";
import { SearchFilters } from "./search-filters";
import { SearchResults } from "./search-results";
import { SearchSheets } from "./search-sheets";
import { useLedgerSearch } from "./use-ledger-search";

export interface LedgerSearchScreenProps {
  readonly onCancel: () => void;
  readonly onOpenTransaction: (transaction: V2Transaction) => void;
}

/** Board spacing: 11pt under the status bar, 14pt between the bar and the filters. */
const TOP_GAP = 11;
const GAP = 14;
/** The board leaves 40pt under the last result; there is no tab bar here. */
const BOTTOM_GAP = 40;

/** Ledger search: notes matched as you type, narrowed by date, account, category and recurring. */
export function LedgerSearchScreen({ onCancel, onOpenTransaction }: LedgerSearchScreenProps) {
  const search = useLedgerSearch();
  const insets = useSafeAreaInsets();
  return (
    <Screen edges={["top"]}>
      <View style={styles.head}>
        <SearchBar
          onCancel={onCancel}
          onChange={(query) => search.update({ query })}
          value={search.state.query}
        />
        <SearchFilters search={search} />
      </View>
      <SearchResults
        bottomInset={insets.bottom + BOTTOM_GAP}
        onOpenTransaction={onOpenTransaction}
        search={search}
      />
      <SearchSheets search={search} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { gap: GAP, paddingHorizontal: layout.screenGutter, paddingTop: TOP_GAP },
});

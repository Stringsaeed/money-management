import { StyleSheet, View } from "react-native";

import { colors, FilterButton, Header, layout, radius, Skeleton, space } from "@/ui/trove";

interface LedgerHeaderProps {
  /** Applied filters; the disc turns accent from one and counts from two. */
  readonly applied: number;
  /** The first page is loading: the filter disc is a placeholder. */
  readonly loading: boolean;
  readonly onOpenFilters: () => void;
}

/** Board spacing: 15pt under the status bar. */
const TOP_GAP = 15;
/** Part of the 16pt gap to the search pill that stays fixed while the list scrolls. */
export const LEDGER_HEADER_FOOT = space[2];

/** Pinned above the list: the large "Ledger" title and the filter disc. */
export function LedgerHeader({ applied, loading, onOpenFilters }: LedgerHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.title}>
        <Header title="Ledger" />
      </View>
      {loading ? (
        <Skeleton
          borderRadius={radius.full}
          height={layout.minTouchTarget}
          style={styles.disc}
          width={layout.minTouchTarget}
        />
      ) : (
        <FilterButton
          active={applied > 0}
          count={applied}
          label="Filters"
          onPress={onOpenFilters}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: space[3],
    paddingBottom: LEDGER_HEADER_FOOT,
    paddingHorizontal: layout.screenGutter,
    paddingTop: TOP_GAP,
  },
  title: { flex: 1 },
  disc: { backgroundColor: colors.fill.neutral },
});

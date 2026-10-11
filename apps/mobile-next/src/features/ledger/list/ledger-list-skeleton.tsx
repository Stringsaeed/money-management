import { ScrollView, StyleSheet, View, type DimensionValue } from "react-native";

import { colors, layout, radius, Skeleton, space } from "@/ui/trove";

/** The board's placeholder days: title-line widths for each row, as a share of the copy column. */
const GROUPS: readonly { key: string; rows: readonly DimensionValue[] }[] = [
  { key: "a", rows: ["62%", "48%"] },
  { key: "b", rows: ["40%", "58%", "52%"] },
];
const CHIP_WIDTHS = [104, 118, 104] as const;

interface LedgerListSkeletonProps {
  readonly bottomInset: number;
}

/** The Ledger board while its first page loads: search, shortcuts, totals, and two days of rows. */
export function LedgerListSkeleton({ bottomInset }: LedgerListSkeletonProps) {
  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: bottomInset }]}
      scrollEnabled={false}
      style={styles.scroll}
    >
      <View
        accessibilityLabel="Loading ledger"
        accessibilityState={{ busy: true }}
        accessible
        style={styles.stack}
      >
        <Skeleton borderRadius={radius.full} height={48} style={styles.fill} />
        <View style={styles.chips}>
          {CHIP_WIDTHS.map((width, index) => (
            <Skeleton
              key={`${width}-${index}`}
              borderRadius={radius.full}
              height={36}
              style={styles.fill}
              width={width}
            />
          ))}
        </View>
        <Skeleton borderRadius={radius.lg} height={76} style={styles.fill} />
        {GROUPS.map((group) => (
          <View key={group.key}>
            <Skeleton borderRadius={5} height={10} style={[styles.fill, styles.stamp]} width={90} />
            {group.rows.map((width, index) => (
              <View key={`${group.key}-${index}`} style={styles.row}>
                <Skeleton borderRadius={radius.full} height={40} style={styles.fill} width={40} />
                <View style={styles.lines}>
                  <Skeleton borderRadius={6} height={12} style={styles.fill} width={width} />
                  <Skeleton borderRadius={5} height={9} style={styles.fill} width="45%" />
                </View>
                <Skeleton borderRadius={6} height={12} style={styles.fill} width={64} />
              </View>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: layout.screenGutter, paddingTop: space[2] },
  stack: { gap: space[4] },
  fill: { backgroundColor: colors.fill.neutral },
  chips: { flexDirection: "row", gap: space[2] },
  stamp: { marginBottom: space[2], marginTop: 10 },
  row: {
    alignItems: "center",
    borderBottomColor: colors.border.subtle,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: space[3],
    minHeight: 62,
  },
  lines: { flex: 1, gap: 6 },
});

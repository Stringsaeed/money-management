import { StyleSheet, View, type DimensionValue } from "react-native";

import { colors, layout, radius, Skeleton, space } from "@/ui/trove";

const ROWS: readonly DimensionValue[] = ["58%", "44%", "62%"];

/** While the first page of matches loads: the results strip and a month of rows. */
export function SearchSkeleton() {
  return (
    <View
      accessibilityLabel="Searching"
      accessibilityState={{ busy: true }}
      accessible
      style={styles.stack}
    >
      <Skeleton borderRadius={radius.md} height={38} style={styles.fill} />
      <View>
        <Skeleton borderRadius={5} height={10} style={[styles.fill, styles.stamp]} width={90} />
        {ROWS.map((width, index) => (
          <View key={`row-${index}`} style={styles.row}>
            <Skeleton borderRadius={radius.full} height={40} style={styles.fill} width={40} />
            <View style={styles.lines}>
              <Skeleton borderRadius={6} height={12} style={styles.fill} width={width} />
              <Skeleton borderRadius={5} height={9} style={styles.fill} width="55%" />
            </View>
            <Skeleton borderRadius={6} height={12} style={styles.fill} width={64} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 14, paddingHorizontal: layout.screenGutter, paddingTop: 14 },
  fill: { backgroundColor: colors.fill.neutral },
  stamp: { marginBottom: space[2], marginTop: 6 },
  row: {
    alignItems: "center",
    borderBottomColor: colors.border.subtle,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: space[3],
    minHeight: 60,
  },
  lines: { flex: 1, gap: 6 },
});

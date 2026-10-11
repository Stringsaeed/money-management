import { StyleSheet, View } from "react-native";

import { colors, radius, Skeleton, space } from "@/ui/trove";

const ROWS = [0, 1] as const;

/** The Home board's loading state: net worth, the slip, the chart, and two upcoming rows. */
export function HomeSkeleton() {
  return (
    <View
      accessibilityLabel="Loading home"
      accessibilityState={{ busy: true }}
      accessible
      style={styles.stack}
    >
      <Skeleton borderRadius={6} height={12} style={styles.fill} width={90} />
      <Skeleton
        borderRadius={radius.md}
        height={46}
        style={[styles.fill, styles.figure]}
        width={230}
      />
      <Skeleton borderRadius={radius.md} height={96} style={styles.fill} />
      <Skeleton borderRadius={radius.lg} height={170} style={styles.fill} />
      {ROWS.map((row) => (
        <View key={row} style={styles.row}>
          <Skeleton borderRadius={radius.md} height={46} style={styles.fill} width={44} />
          <View style={styles.lines}>
            <Skeleton borderRadius={6} height={12} style={styles.fill} width="60%" />
            <Skeleton borderRadius={5} height={10} style={styles.fill} width="40%" />
          </View>
          <Skeleton borderRadius={6} height={12} style={styles.fill} width={64} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 18 },
  fill: { backgroundColor: colors.fill.neutral },
  // The board pulls the figure placeholder up under its label.
  figure: { marginTop: -space[2] },
  row: { alignItems: "center", flexDirection: "row", gap: space[3], height: 64 },
  lines: { flex: 1, gap: 6 },
});

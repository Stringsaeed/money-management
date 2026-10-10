import { StyleSheet, View } from "react-native";

import { layout, radius, Skeleton, space } from "@/ui/trove";

const ROWS = ["a", "b", "c", "d", "e", "f"] as const;

/** Placeholder rows shown while the first page of the Ledger loads. */
export function LedgerListSkeleton() {
  return (
    <View accessible accessibilityLabel="Loading ledger" accessibilityState={{ busy: true }}>
      {ROWS.map((key) => (
        <View key={key} style={styles.row}>
          <Skeleton width={40} height={40} borderRadius={radius.sm} />
          <View style={styles.copy}>
            <Skeleton width="55%" height={14} />
            <Skeleton width="35%" height={12} />
          </View>
          <Skeleton width={64} height={14} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: space[3],
    minHeight: layout.listRowMinHeight,
    paddingHorizontal: layout.screenGutter,
    paddingVertical: space[2],
  },
  copy: { flex: 1, gap: space[2] },
});

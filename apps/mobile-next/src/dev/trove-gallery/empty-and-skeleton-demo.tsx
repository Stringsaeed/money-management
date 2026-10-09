import { StyleSheet, View } from "react-native";

import { EmptyState, radius, Skeleton, space } from "@/ui/trove";

import { GalleryGroup } from "./gallery-group";
import { noop } from "./utils";

export function EmptyAndSkeletonDemo() {
  return (
    <>
      <GalleryGroup label="EMPTY STATE">
        <EmptyState
          actionLabel="Add transaction"
          icon="receipt"
          message="Add your first transaction to see it here."
          onAction={noop}
          title="No transactions yet"
        />
      </GalleryGroup>
      <GalleryGroup label="SKELETON">
        <View accessibilityState={{ busy: true }} style={styles.row}>
          <Skeleton borderRadius={radius.sm} height={40} width={40} />
          <View style={styles.lines}>
            <Skeleton height={14} width="60%" />
            <Skeleton height={12} width="35%" />
          </View>
          <Skeleton height={16} width={64} />
        </View>
        <Skeleton borderRadius={radius.lg} height={96} />
      </GalleryGroup>
    </>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: "center", flexDirection: "row", gap: space[3] },
  lines: { flex: 1, gap: space[2] },
});

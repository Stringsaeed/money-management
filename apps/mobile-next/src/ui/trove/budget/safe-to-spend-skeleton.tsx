import { StyleSheet, View } from "react-native";

import { Skeleton } from "../feedback/skeleton";
import { colors } from "../tokens";

export interface SafeToSpendSkeletonProps {
  /** Spoken while loading (default "Loading your budget"). */
  accessibilityLabel?: string;
}

/** Budget home hero while it loads: caption, figure, pace chip and runway placeholders. */
export function SafeToSpendSkeleton({
  accessibilityLabel = "Loading your budget",
}: SafeToSpendSkeletonProps) {
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ busy: true }}
      accessible
      style={styles.column}
    >
      <Skeleton borderRadius={6} height={12} style={styles.bar} width={120} />
      <Skeleton borderRadius={12} height={52} style={styles.bar} width={220} />
      <Skeleton borderRadius={6} height={20} style={styles.bar} width={250} />
      <Skeleton borderRadius={6} height={14} style={styles.bar} width="100%" />
    </View>
  );
}

const styles = StyleSheet.create({
  column: { gap: 12 },
  // The board draws the placeholders in fill.neutral rather than the skeleton's default tone.
  bar: { backgroundColor: colors.fill.neutral, maxWidth: "100%" },
});

import { StyleSheet, View } from "react-native";

import { radius, Skeleton, space } from "@/ui/trove";

/** Loading placeholder: shapes only, never a number. */
export function BudgetHomeSkeleton() {
  return (
    <View
      accessible
      accessibilityLabel="Loading your budget"
      accessibilityState={{ busy: true }}
      style={styles.container}
    >
      <Skeleton height={space[4]} width="30%" />
      <Skeleton height={space[10]} width="60%" />
      <Skeleton height={space[4]} width="50%" />
      <Skeleton borderRadius={radius.lg} height={ROW_HEIGHT} />
      <Skeleton borderRadius={radius.lg} height={ROW_HEIGHT} />
      <Skeleton borderRadius={radius.lg} height={ROW_HEIGHT} />
    </View>
  );
}

const ROW_HEIGHT = space[12] + space[2];

const styles = StyleSheet.create({
  container: { gap: space[3] },
});

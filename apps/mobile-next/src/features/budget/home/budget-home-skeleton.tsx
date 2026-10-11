import { StyleSheet, View } from "react-native";

import { colors, radii, spacing } from "@/ui/design-tokens";

/** Loading placeholder: shapes only, never a number. */
export function BudgetHomeSkeleton() {
  return (
    <View
      accessible
      accessibilityLabel="Loading your budget"
      accessibilityState={{ busy: true }}
      style={styles.container}
    >
      <View style={[styles.block, styles.label]} />
      <View style={[styles.block, styles.amount]} />
      <View style={[styles.block, styles.caption]} />
      <View style={[styles.block, styles.row]} />
      <View style={[styles.block, styles.row]} />
      <View style={[styles.block, styles.row]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing[3] },
  block: { backgroundColor: colors.surfaceContainer, borderRadius: radii.lg },
  label: { height: spacing[4], width: "30%" },
  amount: { height: spacing[10], width: "60%" },
  caption: { height: spacing[4], width: "50%" },
  row: { height: spacing[14] },
});

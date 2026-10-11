import { StyleSheet, View } from "react-native";

import { colors, radii, spacing } from "@/ui/design-tokens";
import { Text } from "@/ui/text";

interface StatRowProps {
  readonly label: string;
  readonly value: string;
  /** Terracotta value, for numbers that need a second look. */
  readonly warn?: boolean;
}

/** One label and value on a card, read as a single line by screen readers. */
export function StatRow({ label, value, warn = false }: StatRowProps) {
  return (
    <View accessible accessibilityLabel={`${label}, ${value}`} style={styles.row}>
      <Text variant="caption">{label}</Text>
      <Text variant="body" style={warn && styles.warn}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderCurve: "continuous",
    borderRadius: radii.lg,
    flexDirection: "row",
    gap: spacing[3],
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  warn: { color: colors.terracotta },
});

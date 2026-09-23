import { StyleSheet, View } from "react-native";

import { Surface } from "@/ui/surface";
import { Text } from "@/ui/text";
import { colors, spacing, typography } from "@/ui/design-tokens";

interface HomeStatCardProps {
  readonly label: string;
  readonly value: string;
  readonly tone?: "default" | "positive" | "negative";
}

export function HomeStatCard({ label, value, tone = "default" }: HomeStatCardProps) {
  return (
    <Surface style={styles.surface}>
      <View style={styles.content}>
        <Text style={styles.label}>{label}</Text>
        <Text
          style={[
            styles.value,
            tone === "positive" && styles.positive,
            tone === "negative" && styles.negative,
          ]}
        >
          {value}
        </Text>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  surface: { flex: 1, minWidth: 140 },
  content: { gap: spacing[2] },
  label: {
    color: colors.mutedForeground,
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textXs,
    letterSpacing: typography.trackingWide,
    textTransform: "uppercase",
  },
  value: {
    color: colors.ink,
    fontFamily: typography.fontHeadingMedium,
    fontSize: typography.textLg,
    fontVariant: ["tabular-nums"],
  },
  positive: { color: colors.sage },
  negative: { color: colors.terracotta },
});

import { StyleSheet, View } from "react-native";

import { Text } from "../text";
import { colors, DENSE_MAX_FONT_SCALE, radius } from "../tokens";

export interface SoonBadgeProps {
  /** Visible text. Defaults to "Coming soon", or "Soon" when `compact`. */
  label?: string;
  /** Short form for tight rows and tiles. */
  compact?: boolean;
}

/**
 * Dashed pill for a feature that is not printed yet. It only labels: the tile or row that
 * holds it stays tappable and opens "Notify me".
 */
export function SoonBadge({ label, compact = false }: SoonBadgeProps) {
  const visible = label ?? (compact ? "Soon" : "Coming soon");
  const spoken = label ?? "Coming soon";

  return (
    <View accessibilityLabel={spoken} accessibilityRole="text" accessible style={styles.pill}>
      <Text
        maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
        style={styles.label}
        tone="secondary"
        variant="stamp"
      >
        {visible}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: "flex-start",
    borderColor: colors.border.default,
    borderCurve: "continuous",
    borderRadius: radius.full,
    borderStyle: "dashed",
    borderWidth: 1.5,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  label: { fontSize: 10, letterSpacing: 1, lineHeight: 14 },
});

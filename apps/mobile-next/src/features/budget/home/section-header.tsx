import { StyleSheet, View } from "react-native";

import { DENSE_MAX_FONT_SCALE, Text } from "@/ui/trove";

interface SectionHeaderProps {
  /** Mono caps caption, e.g. "EVERYDAY". */
  readonly title: string;
  /** Caption on the right, e.g. "AED 1,612 LEFT". */
  readonly trailing?: string;
}

/** A Budget home section's caption row: stamp title on the left, a stamp figure on the right. */
export function SectionHeader({ title, trailing }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <Text
        accessibilityRole="header"
        maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
        numberOfLines={1}
        style={styles.title}
        tone="tertiary"
        variant="stamp"
      >
        {title}
      </Text>
      {trailing ? (
        <Text
          maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
          numberOfLines={1}
          tone="tertiary"
          variant="stamp"
        >
          {trailing}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "baseline",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    marginBottom: 4,
  },
  title: { flexShrink: 1 },
});

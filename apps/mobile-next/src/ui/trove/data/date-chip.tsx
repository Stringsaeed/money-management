import { StyleSheet, View } from "react-native";

import { Text } from "../text";
import { colors, DENSE_MAX_FONT_SCALE, radius } from "../tokens";
import { dateChipParts } from "./date-chip-utils";

export interface DateChipProps {
  /** ISO date, `yyyy-MM-dd`. */
  date: string;
  /** Month band takes the highlighter: the next due item. */
  highlighted?: boolean;
  /** Hide from screen readers when a row around the chip already speaks the date. */
  decorative?: boolean;
  testID?: string;
}

/**
 * 46pt calendar chip: month band over a mono day number. Reads as one date ("12 October"),
 * not as two separate fragments.
 */
export function DateChip({ date, highlighted = false, decorative = false, testID }: DateChipProps) {
  const parts = dateChipParts(date);

  return (
    <View
      accessibilityElementsHidden={decorative}
      accessibilityLabel={decorative ? undefined : parts.spoken}
      accessibilityRole={decorative ? undefined : "text"}
      accessible={!decorative}
      importantForAccessibility={decorative ? "no-hide-descendants" : "auto"}
      style={styles.chip}
      testID={testID}
    >
      <View style={[styles.band, highlighted ? styles.bandHighlighted : styles.bandQuiet]}>
        <Text
          maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
          style={styles.month}
          tone={highlighted ? "onPaper" : "secondary"}
          variant="stamp"
        >
          {parts.month}
        </Text>
      </View>
      <Text maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={styles.day} variant="amountMd">
        {parts.day}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: colors.surface.default,
    borderColor: colors.border.default,
    borderCurve: "continuous",
    borderRadius: radius.md,
    borderWidth: 1,
    flexShrink: 0,
    overflow: "hidden",
    width: 46,
  },
  band: { alignItems: "center", paddingVertical: 2 },
  bandQuiet: { backgroundColor: colors.fill.neutral },
  bandHighlighted: { backgroundColor: colors.highlight },
  month: { fontSize: 10, letterSpacing: 1, lineHeight: 14 },
  day: {
    fontSize: 19,
    lineHeight: 24,
    paddingBottom: 4,
    paddingTop: 3,
    textAlign: "center",
  },
});

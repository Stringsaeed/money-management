import { StyleSheet, Text as NativeText, View } from "react-native";

import { colors, dateChipParts, DENSE_MAX_FONT_SCALE, fonts, radius } from "@/ui/trove";

interface HomeDateChipProps {
  /** `yyyy-MM-dd`. */
  readonly date: string;
  /** The next item due: the month band takes the highlighter. */
  readonly next: boolean;
}

/** 44pt calendar chip from the Home board. Decorative: the row speaks the date. */
export function HomeDateChip({ date, next }: HomeDateChipProps) {
  const parts = dateChipParts(date);
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.chip}
    >
      <View style={[styles.band, next ? styles.bandNext : styles.bandQuiet]}>
        <NativeText
          maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
          style={[styles.month, next ? styles.monthNext : styles.monthQuiet]}
        >
          {parts.month.toUpperCase()}
        </NativeText>
      </View>
      <NativeText maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={styles.day}>
        {parts.day}
      </NativeText>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: colors.surface.default,
    borderColor: colors.border.default,
    borderRadius: radius.md,
    borderWidth: 1,
    flexShrink: 0,
    overflow: "hidden",
    width: 44,
  },
  // The 1pt border takes the place of the board's inset ring, so it comes off the padding.
  band: { alignItems: "center", paddingBottom: 2, paddingTop: 1 },
  bandQuiet: { backgroundColor: colors.fill.neutral },
  bandNext: { backgroundColor: colors.highlight },
  month: { fontFamily: fonts.monoSemibold, fontSize: 10, letterSpacing: 1, lineHeight: 13 },
  monthQuiet: { color: colors.text.secondary },
  monthNext: { color: colors.paper.ink },
  day: {
    color: colors.text.primary,
    fontFamily: fonts.monoMedium,
    fontSize: 18,
    lineHeight: 22,
    paddingBottom: 2,
    paddingTop: 2,
    textAlign: "center",
  },
});

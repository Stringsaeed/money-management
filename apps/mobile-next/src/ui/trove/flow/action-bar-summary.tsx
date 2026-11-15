import { StyleSheet, Text as NativeText, View } from "react-native";

import { colors, DENSE_MAX_FONT_SCALE, fonts } from "../tokens";

export interface ActionBarSummaryValue {
  /** Mono caps caption, e.g. "MONEY TO PLAN". */
  label: string;
  /** Preformatted figure or count, e.g. "AED 14,200" or "11 ticked". */
  value: string;
  /** Defaults to "{label}: {value}". */
  accessibilityLabel?: string;
}

/** Left slot of the action bar: a 10pt mono caption over a 19pt mono figure. */
export function ActionBarSummary({ label, value, accessibilityLabel }: ActionBarSummaryValue) {
  return (
    <View
      accessibilityLabel={accessibilityLabel ?? `${label}: ${value}`}
      accessible
      style={styles.slot}
    >
      <NativeText
        maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
        numberOfLines={1}
        style={styles.label}
      >
        {label}
      </NativeText>
      <NativeText
        maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
        numberOfLines={1}
        style={styles.value}
      >
        {value}
      </NativeText>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: { flex: 1 },
  label: {
    color: colors.text.tertiary,
    fontFamily: fonts.monoSemibold,
    fontSize: 10,
    letterSpacing: 1.2,
    lineHeight: 13,
  },
  value: {
    color: colors.text.primary,
    fontFamily: fonts.monoMedium,
    fontSize: 19,
    lineHeight: 25,
  },
});

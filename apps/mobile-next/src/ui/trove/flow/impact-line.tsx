import { StyleSheet, Text as NativeText, View } from "react-native";

import { colors, DENSE_MAX_FONT_SCALE, fonts, radius } from "../tokens";

export type ImpactTone = "ok" | "over";

export interface ImpactLineProps {
  /** ok: fits the envelope · over: pushes it over. */
  tone: ImpactTone;
  /** e.g. "Dining & coffee will be AED 175 over". */
  text: string;
  /** Leading mark; defaults to "✓" (ok) or "⚠︎" (over, text presentation). */
  glyph?: string;
  /** Pill alignment in its column: start (default) or center (Quick add). */
  align?: "start" | "center";
  testID?: string;
}

const GLYPH = { ok: "✓", over: "⚠︎" } as const satisfies Record<ImpactTone, string>;

/** Live projection pill under an amount: what this entry does to its envelope. */
export function ImpactLine({ tone, text, glyph, align = "start", testID }: ImpactLineProps) {
  const ink = tone === "over" ? styles.overInk : styles.okInk;

  return (
    <View
      accessibilityLabel={text}
      accessibilityLiveRegion="polite"
      accessibilityRole="text"
      accessible
      style={[styles.pill, tone === "over" ? styles.over : styles.ok, alignStyles[align]]}
      testID={testID}
    >
      <NativeText maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={[styles.text, ink]}>
        {glyph ?? GLYPH[tone]}
      </NativeText>
      <NativeText
        maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
        style={[styles.text, styles.label, ink]}
      >
        {text}
      </NativeText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: radius.full,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  ok: { backgroundColor: colors.accent.subtle },
  over: { backgroundColor: colors.negative.subtle },
  // Board ok ink is #3F6B00 paper / #D9FF43 dark: the positive.text pair (this line is about money).
  okInk: { color: colors.positive.text },
  overInk: { color: colors.negative.text },
  text: { fontFamily: fonts.extrabold, fontSize: 14, lineHeight: 18 },
  label: { flexShrink: 1 },
});

const alignStyles = StyleSheet.create({
  start: { alignSelf: "flex-start" },
  center: { alignSelf: "center" },
});

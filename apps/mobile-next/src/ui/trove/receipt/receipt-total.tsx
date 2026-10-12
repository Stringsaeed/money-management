import { StyleSheet, Text as NativeText, View, type TextStyle } from "react-native";

import { colors, DENSE_MAX_FONT_SCALE, fonts } from "../tokens";

/** `ok` on the lime marker, `warn` for over-planned, `neg` for uncovered or overspent. */
export type ReceiptTotalTone = "ok" | "warn" | "neg";

/** `md` 14/16 (calc receipt) · `lg` 15/18 (intro, envelope) · `xl` 16/18 (setup review). */
export type ReceiptTotalSize = "md" | "lg" | "xl";

export interface ReceiptTotalProps {
  /** e.g. "LEFT TO PLAN", "TOTAL", "SAFE TO SPEND". */
  label: string;
  /** Preformatted, printed on the marker, e.g. "AED 730". */
  value: string;
  tone?: ReceiptTotalTone;
  size?: ReceiptTotalSize;
  /**
   * Prints the label in the tone's ink too, as the calc receipt does. Off by default: screens
   * keep the label in ink and tint only the marked value.
   */
  toneLabel?: boolean;
}

/** A receipt's total line: label on the left, the figure on a highlighter marker on the right. */
export function ReceiptTotal({
  label,
  value,
  tone = "ok",
  size = "lg",
  toneLabel = false,
}: ReceiptTotalProps) {
  const sizeStyle = SIZE[size];
  return (
    <View accessibilityLabel={`${label} ${value}`} accessible style={styles.row}>
      <NativeText
        maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
        style={[styles.text, styles.label, sizeStyle, toneLabel ? INK[tone] : INK.ok]}
      >
        {label}
      </NativeText>
      <NativeText
        maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
        style={[styles.text, styles.marker, sizeStyle, INK[tone], MARKER[tone]]}
      >
        {value}
      </NativeText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "baseline",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  text: { fontFamily: fonts.monoSemibold },
  label: { flexShrink: 1 },
  marker: { paddingHorizontal: 4 },
  md: { fontSize: 14, lineHeight: 16 },
  lg: { fontSize: 15, lineHeight: 18 },
  xl: { fontSize: 16, lineHeight: 18 },
  inkOk: { color: colors.text.onPaper },
  inkWarn: { color: colors.paper.warning },
  inkNeg: { color: colors.paper.negative },
  markerOk: { backgroundColor: colors.highlight },
  markerWarn: { backgroundColor: colors.paper.warningMarker },
  markerNeg: { backgroundColor: colors.paper.negativeMarker },
});

const SIZE = { md: styles.md, lg: styles.lg, xl: styles.xl } as const satisfies Record<
  ReceiptTotalSize,
  TextStyle
>;

const INK = {
  ok: styles.inkOk,
  warn: styles.inkWarn,
  neg: styles.inkNeg,
} as const satisfies Record<ReceiptTotalTone, TextStyle>;

const MARKER = {
  ok: styles.markerOk,
  warn: styles.markerWarn,
  neg: styles.markerNeg,
} as const satisfies Record<ReceiptTotalTone, TextStyle>;

import { StyleSheet, Text as NativeText, View } from "react-native";

import { CurrencySign } from "../amount/currency-sign";
import { MINUS } from "../amount/amount-parts";
import { Text } from "../text";
import { colors, DENSE_MAX_FONT_SCALE, fonts } from "../tokens";
import { compactAmount } from "./budget-money";
import { RunwayStrip, type RunwayTick } from "./runway-strip";
import { daysLeftText, paceChipLabel, paceChipText, safeToSpendLabel } from "./safe-to-spend-copy";

export interface SafeToSpendProps {
  /** ISO 4217 code; AED and SAR draw their glyph, others their sign. */
  currency: string;
  /** Safe to spend in signed minor units; below zero prints red with a minus. */
  safeMinor: number;
  /** Daily amount in minor units. Pass whole units (floored) to print `≈ AED 142 A DAY`. */
  perDayMinor: number;
  /** Days to payday, today included. */
  daysLeft: number;
  /** One tick per day of the pay period. */
  ticks: readonly RunwayTick[];
  /** Spoken summary of the strip, e.g. "Day 17 of 30. 12 days under your daily amount, 4 over. 14 days to payday." */
  runwayLabel: string;
  /** Printed after the days caption, e.g. 💰. */
  daysEmoji?: string;
  /** Caption above the figure (default "SAFE TO SPEND"). */
  label?: string;
}

/** Glyph height beside the 52pt figure (37×32 for the dirham). */
const GLYPH_SIZE = 32;

/** Budget home hero: the figure safe to spend, its daily pace, and the pay-period runway. */
export function SafeToSpend({
  currency,
  safeMinor,
  perDayMinor,
  daysLeft,
  ticks,
  runwayLabel,
  daysEmoji,
  label = "SAFE TO SPEND",
}: SafeToSpendProps) {
  const negative = safeMinor < 0;
  const empty = safeMinor <= 0;
  return (
    <View style={styles.column}>
      <Text
        accessibilityElementsHidden
        importantForAccessibility="no"
        maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
        tone="tertiary"
        variant="stamp"
      >
        {label}
      </Text>
      <View
        accessibilityLabel={safeToSpendLabel(safeMinor, currency)}
        accessibilityRole="text"
        accessible
        style={styles.figureRow}
      >
        <CurrencySign
          code={currency}
          size={GLYPH_SIZE}
          tone={negative ? "negative" : "accent"}
          variant="amountHero"
        />
        <NativeText
          adjustsFontSizeToFit
          maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
          minimumFontScale={0.5}
          numberOfLines={1}
          style={[styles.figure, negative ? styles.figureNegative : null]}
        >
          {`${negative ? MINUS : ""}${compactAmount(safeMinor, currency)}`}
        </NativeText>
      </View>
      <View
        accessibilityLabel={paceChipLabel(safeMinor, perDayMinor, currency)}
        accessibilityRole="text"
        accessible
        style={[styles.chip, empty ? styles.chipEmpty : styles.chipOk]}
      >
        <NativeText
          maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
          style={[styles.chipText, empty ? styles.chipTextEmpty : styles.chipTextOk]}
        >
          {paceChipText(safeMinor, perDayMinor, currency)}
        </NativeText>
      </View>
      <View
        accessibilityLabel={runwayLabel}
        accessibilityRole="image"
        accessible
        style={styles.runway}
      >
        <RunwayStrip ticks={ticks} />
        <NativeText maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={styles.days}>
          {daysEmoji ? `${daysLeftText(daysLeft)} ${daysEmoji}` : daysLeftText(daysLeft)}
        </NativeText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  column: { gap: 10 },
  figureRow: { alignItems: "baseline", flexDirection: "row", gap: 8 },
  figure: {
    color: colors.text.primary,
    flexShrink: 1,
    fontFamily: fonts.monoMedium,
    fontSize: 52,
    letterSpacing: -2.5,
    lineHeight: 56,
  },
  figureNegative: { color: colors.negative.text },
  chip: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3 },
  chipOk: { backgroundColor: colors.highlight },
  chipEmpty: { backgroundColor: colors.negative.subtle },
  chipText: { fontFamily: fonts.monoSemibold, fontSize: 12, lineHeight: 16 },
  chipTextOk: { color: colors.paper.ink },
  chipTextEmpty: { color: colors.negative.text },
  runway: { alignItems: "center", flexDirection: "row", gap: 10, marginTop: 4 },
  days: {
    color: colors.text.secondary,
    fontFamily: fonts.monoSemibold,
    fontSize: 11,
    letterSpacing: 1,
    lineHeight: 14,
  },
});

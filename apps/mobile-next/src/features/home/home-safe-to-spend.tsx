import { StyleSheet, Text as NativeText, View } from "react-native";

import {
  amountAccessibilityLabel,
  colors,
  DENSE_MAX_FONT_SCALE,
  fonts,
  PressableScale,
  space,
} from "@/ui/trove";

import { compactAmount } from "./home-money";
import { HomeReceiptTear } from "./home-receipt-tear";
import type { SpendTick } from "./home-spend-ticks";
import { HomeSpendStrip } from "./home-spend-strip";

interface HomeSafeToSpendProps {
  readonly currency: string;
  readonly safeToSpendMinor: number;
  readonly perDayMinor: number;
  readonly daysLeft: number;
  readonly ticks: readonly SpendTick[];
  readonly onPress: () => void;
}

/** Torn paper slip: safe to spend, the daily pace, and the pay period printed as day ticks. */
export function HomeSafeToSpend({
  currency,
  safeToSpendMinor,
  perDayMinor,
  daysLeft,
  ticks,
  onPress,
}: HomeSafeToSpendProps) {
  const negative = safeToSpendMinor < 0;
  const days = `${daysLeft} ${daysLeft === 1 ? "DAY" : "DAYS"}`;
  const label = [
    `Safe to spend ${amountAccessibilityLabel(safeToSpendMinor, currency)}`,
    `about ${compactAmount(perDayMinor, currency)} a day`,
    `${daysLeft} ${daysLeft === 1 ? "day" : "days"} to payday. Open budget`,
  ].join(", ");
  return (
    <PressableScale accessibilityLabel={label} accessibilityRole="link" onPress={onPress}>
      <View style={styles.slip}>
        <View style={styles.topRow}>
          <NativeText maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={styles.stamp}>
            SAFE TO SPEND
          </NativeText>
          <NativeText maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={styles.link}>
            Budget ›
          </NativeText>
        </View>
        <View style={styles.figureRow}>
          <NativeText
            maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
            numberOfLines={1}
            style={[styles.figure, negative ? styles.negative : null]}
          >
            {`${negative ? "−" : ""}${currency} ${compactAmount(safeToSpendMinor, currency)}`}
          </NativeText>
          <View style={styles.pace}>
            <NativeText maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={styles.paceText}>
              {`≈ ${compactAmount(Math.max(perDayMinor, 0), currency)} A DAY`}
            </NativeText>
          </View>
        </View>
        <View style={styles.periodRow}>
          <HomeSpendStrip ticks={ticks} />
          <NativeText maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={styles.days}>
            {`${days} 💰`}
          </NativeText>
        </View>
      </View>
      <HomeReceiptTear depth={8} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  slip: {
    backgroundColor: colors.surface.paper,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    boxShadow: [{ offsetX: 0, offsetY: 1, blurRadius: 2, color: colors.paper.shadow }],
    gap: space[2],
    paddingBottom: 10,
    paddingHorizontal: space[4],
    paddingTop: 14,
  },
  topRow: { alignItems: "baseline", flexDirection: "row", justifyContent: "space-between" },
  stamp: {
    color: colors.paper.textTertiary,
    fontFamily: fonts.monoSemibold,
    fontSize: 11,
    letterSpacing: 1.2,
    lineHeight: 14,
  },
  link: {
    color: colors.paper.accentText,
    fontFamily: fonts.extrabold,
    fontSize: 14,
    lineHeight: 19,
  },
  figureRow: { alignItems: "baseline", flexDirection: "row", gap: 10 },
  figure: {
    color: colors.text.onPaper,
    flexShrink: 1,
    fontFamily: fonts.monoSemibold,
    fontSize: 26,
    lineHeight: 30,
  },
  negative: { color: colors.paper.negative },
  pace: { backgroundColor: colors.highlight, paddingHorizontal: space[1] },
  paceText: {
    color: colors.paper.ink,
    fontFamily: fonts.monoSemibold,
    fontSize: 12,
    lineHeight: 16,
  },
  periodRow: { alignItems: "center", flexDirection: "row", gap: space[2] },
  days: {
    color: colors.paper.textSecondary,
    fontFamily: fonts.monoSemibold,
    fontSize: 10,
    letterSpacing: 1,
    lineHeight: 13,
  },
});

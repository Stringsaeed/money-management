import { StyleSheet, Text as NativeText, View } from "react-native";

import { amountAccessibilityLabel, colors, DENSE_MAX_FONT_SCALE, fonts, radius } from "@/ui/trove";

import { plainAmount } from "../list/ledger-money";
import type { LedgerTotals } from "../list/ledger-totals";

interface SearchStatusProps {
  /** `5 RESULTS · SINCE AUG`. */
  readonly stamp: string;
  /** Net of the matches; `null` while it loads or when nothing matched. */
  readonly totals: LedgerTotals | null;
}

/** Paper strip over the results: how many matched, and their net marked in lime. */
export function SearchStatus({ stamp, totals }: SearchStatusProps) {
  const net = totals ? totals.incomeMinor - totals.expenseMinor : null;
  const label = totals?.mixed ? `${stamp} · ${totals.currency}` : stamp;
  const spokenNet =
    totals && net !== null
      ? `, net ${net > 0 ? "plus " : ""}${amountAccessibilityLabel(net, totals.currency)}`
      : "";
  return (
    <View
      accessibilityLabel={`${label.toLowerCase()}${spokenNet}`}
      accessibilityLiveRegion="polite"
      accessibilityRole="text"
      accessible
      style={styles.strip}
    >
      <NativeText
        maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
        numberOfLines={1}
        style={styles.text}
      >
        {label}
      </NativeText>
      {totals && net !== null ? (
        <NativeText maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={[styles.text, styles.mark]}>
          {plainAmount(net, totals.currency, "always")}
        </NativeText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    alignItems: "baseline",
    backgroundColor: colors.surface.paper,
    borderCurve: "continuous",
    borderRadius: radius.md,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  text: {
    color: colors.text.onPaper,
    flexShrink: 1,
    fontFamily: fonts.monoSemibold,
    fontSize: 13,
    lineHeight: 18,
  },
  mark: { backgroundColor: colors.highlight, flexShrink: 0, paddingHorizontal: 4 },
});

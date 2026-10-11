import { StyleSheet, Text as NativeText, View } from "react-native";

import {
  amountAccessibilityLabel,
  colors,
  DENSE_MAX_FONT_SCALE,
  fonts,
  radius,
  Text,
} from "@/ui/trove";

import { LedgerDashedRule } from "./ledger-dashed-rule";
import { plainAmount } from "./ledger-money";
import type { LedgerTotals } from "./ledger-totals";

interface LedgerTotalsCardProps {
  /** `OCT`, `AUG–OCT`. */
  readonly label: string;
  /** `null` while the period's totals load or when they could not be read. */
  readonly totals: LedgerTotals | null;
}

/** The board pads 14×16 inside a 1pt ring; the ring here is a border, so it takes its point. */
const PAD_Y = 13;
const PAD_OUTER = 15;
const PAD_INNER = 16;
const UNKNOWN = "–";

/** Money in and out over the period, side by side on a receipt-perforated card. */
export function LedgerTotalsCard({ label, totals }: LedgerTotalsCardProps) {
  const stamp = totals?.mixed ? `${label} · ${totals.currency}` : label;
  const income = totals ? plainAmount(totals.incomeMinor, totals.currency, "always") : UNKNOWN;
  const expense = totals ? plainAmount(-totals.expenseMinor, totals.currency) : UNKNOWN;
  const spoken = totals
    ? `In ${amountAccessibilityLabel(totals.incomeMinor, totals.currency)}, out ${amountAccessibilityLabel(totals.expenseMinor, totals.currency)}`
    : "Totals unavailable";
  return (
    <View
      accessibilityLabel={`${stamp.toLowerCase()} totals. ${spoken}`}
      accessibilityRole="summary"
      accessible
      style={styles.card}
    >
      <View style={[styles.cell, styles.cellStart]}>
        <Text maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} tone="tertiary" variant="stamp">
          {`In · ${stamp}`}
        </Text>
        <NativeText
          maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
          numberOfLines={1}
          style={[styles.figure, (totals?.incomeMinor ?? 0) > 0 ? styles.figureIn : null]}
        >
          {income}
        </NativeText>
      </View>
      <LedgerDashedRule color={colors.border.default} orientation="vertical" />
      <View style={[styles.cell, styles.cellEnd]}>
        <Text maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} tone="tertiary" variant="stamp">
          {`Out · ${stamp}`}
        </Text>
        <NativeText
          maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
          numberOfLines={1}
          style={styles.figure}
        >
          {expense}
        </NativeText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface.default,
    borderColor: colors.border.subtle,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
  },
  cell: { flex: 1, gap: 4, minWidth: 0, paddingVertical: PAD_Y },
  cellStart: { paddingLeft: PAD_OUTER, paddingRight: PAD_INNER },
  cellEnd: { paddingLeft: PAD_INNER, paddingRight: PAD_OUTER },
  figure: {
    color: colors.text.primary,
    fontFamily: fonts.monoMedium,
    fontSize: 20,
    lineHeight: 26,
  },
  figureIn: { color: colors.positive.text },
});

import { StyleSheet, View } from "react-native";

import type { V2TransactionSummary } from "@trove/api/v2/contracts";

import { Text } from "@/ui/text";
import { colors, radii, spacing, typography } from "@/ui/design-tokens";
import { formatMoneyMinor } from "@/utils/money";

import { formatNet } from "./ledger-row-display";

interface LedgerSummaryCardProps {
  readonly summary: V2TransactionSummary | undefined;
  readonly caption: string;
}

/** In / out / net for everything matching the filters, not only the rows loaded so far. */
export function LedgerSummaryCard({ summary, caption }: LedgerSummaryCardProps) {
  const total = summary?.totals[0];
  const others = (summary?.totals.length ?? 0) - 1;
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <Text style={styles.caption}>{caption}</Text>
        <Text style={styles.caption}>
          {summary ? `${summary.count.toLocaleString()} entries` : "…"}
        </Text>
      </View>
      <Text style={styles.net} adjustsFontSizeToFit numberOfLines={1}>
        {total ? formatNet(total.netMinor, total.currency) : "—"}
      </Text>
      <View style={styles.split}>
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>Money in</Text>
          <Text style={[styles.cellValue, styles.income]}>
            {total ? formatMoneyMinor(total.incomeMinor, total.currency) : "—"}
          </Text>
        </View>
        <View style={styles.rule} />
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>Money out</Text>
          <Text style={styles.cellValue}>
            {total ? formatMoneyMinor(total.expenseMinor, total.currency) : "—"}
          </Text>
        </View>
      </View>
      {others > 0 ? (
        <Text style={styles.caption}>
          Plus {others} other {others === 1 ? "currency" : "currencies"}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderCurve: "continuous",
    borderRadius: radii["3xl"],
    borderWidth: 1,
    boxShadow: "0px 10px 30px rgba(44, 95, 71, 0.08)",
    gap: spacing[2],
    padding: spacing[5],
  },
  top: { flexDirection: "row", justifyContent: "space-between" },
  caption: {
    color: colors.mutedForeground,
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textXs,
  },
  net: {
    color: colors.foreground,
    fontFamily: typography.fontHeadingBold,
    fontSize: typography.text3xl,
    fontVariant: ["tabular-nums"],
    letterSpacing: typography.trackingTight,
    lineHeight: 40,
  },
  split: { flexDirection: "row", gap: spacing[4], marginTop: spacing[1] },
  cell: { flex: 1, gap: spacing[0.5] },
  rule: { backgroundColor: colors.border, width: 1 },
  cellLabel: {
    color: colors.mutedForeground,
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textXs,
  },
  cellValue: {
    color: colors.foreground,
    fontFamily: typography.fontHeadingSemibold,
    fontSize: typography.textLg,
    fontVariant: ["tabular-nums"],
  },
  income: { color: colors.sage },
});

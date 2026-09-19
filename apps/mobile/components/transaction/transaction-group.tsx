import { StyleSheet, View } from "react-native";

import { MoneyText } from "@/components/ui/money-text";
import { Text } from "@/components/ui/text";
import { colors, spacing, typography } from "@/lib/design-tokens";
import { formatDayHeader } from "@/utils/date";
import type { DayGroup } from "@/types";

import { TransactionRow } from "./transaction-row";

interface TransactionGroupProps {
  group: DayGroup;
  currency?: string;
  showAccount?: boolean;
}

export function TransactionGroup({ group, currency = "USD", showAccount }: TransactionGroupProps) {
  const net = group.totalIncome - group.totalExpense;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.dateLabel}>{formatDayHeader(group.date)}</Text>
        {(group.totalIncome > 0 || group.totalExpense > 0) && (
          <MoneyText
            cents={net}
            currency={currency}
            sign={net >= 0 ? "+" : ""}
            style={[styles.netAmount, net >= 0 ? styles.netPositive : styles.netNegative]}
          />
        )}
      </View>

      <View>
        {group.transactions.map((t, i) => (
          <View key={t.id}>
            {i > 0 && <View style={styles.divider} />}
            <TransactionRow transaction={t} showAccount={showAccount} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[2.5],
    backgroundColor: colors.surfaceContainer,
    opacity: 0.5,
  },
  dateLabel: {
    fontFamily: typography.fontBodySemibold,
    fontSize: 11,
    color: colors.ink,
    opacity: 0.5,
    textTransform: "uppercase",
    letterSpacing: typography.trackingTight,
  },
  netAmount: {
    fontFamily: typography.fontHeadingNormal,
    fontSize: 13,
    fontVariant: ["tabular-nums"],
  },
  netPositive: {
    color: colors.sage,
  },
  netNegative: {
    color: colors.terracotta,
  },
  divider: {
    height: 1,
    backgroundColor: colors.ledgerOutline,
    marginLeft: spacing[16],
  },
});

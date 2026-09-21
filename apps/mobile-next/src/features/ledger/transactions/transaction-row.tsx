/* oxlint-disable complexity -- a transaction row maps kind, sign, and category states in one row. */

import { Pressable, StyleSheet, useColorScheme, View } from "react-native";

import type { V2Category, V2Transaction } from "@trove/api/v2/contracts";

import { Icon } from "@/ui/icon";
import { Text } from "@/ui/text";
import { colors, rawColorValues, spacing, typography } from "@/ui/design-tokens";
import { formatMoneyMinor } from "@/utils/money";

interface TransactionRowProps {
  readonly transaction: V2Transaction;
  readonly category?: V2Category;
  readonly onPress?: (transaction: V2Transaction) => void;
}

export function TransactionRow({ transaction, category, onPress }: TransactionRowProps) {
  const scheme = useColorScheme();
  const iconColor = scheme === "dark" ? rawColorValues.dark.ink : rawColorValues.light.ink;
  const label = transaction.note.trim() || category?.name || "Transaction";
  const sign = transaction.kind === "income" ? "+" : transaction.kind === "expense" ? "−" : "";
  const icon =
    transaction.kind === "income"
      ? "trend-up"
      : transaction.kind === "expense"
        ? "trend-down"
        : "arrow-left";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${label}`}
      onPress={() => onPress?.(transaction)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.iconCircle}>
        <Icon name={icon} size={18} color={iconColor} />
      </View>
      <View style={styles.copy}>
        <Text numberOfLines={1} style={styles.label}>
          {label}
        </Text>
        <Text numberOfLines={1} style={styles.meta}>
          {transaction.date}
          {category ? ` · ${category.name}` : ""}
        </Text>
      </View>
      <Text style={[styles.amount, transaction.kind === "income" && styles.income]}>
        {sign}
        {formatMoneyMinor(transaction.amountMinor, transaction.currency)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[3],
    minHeight: 68,
    paddingVertical: spacing[2],
  },
  pressed: { opacity: 0.62 },
  iconCircle: {
    alignItems: "center",
    backgroundColor: colors.surfaceContainer,
    borderColor: colors.ledgerOutline,
    borderRadius: 999,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  copy: { flex: 1, gap: spacing[0.5] },
  label: {
    color: colors.ink,
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textBase,
  },
  meta: {
    color: colors.mutedForeground,
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textXs,
  },
  amount: {
    color: colors.ink,
    fontFamily: typography.fontHeadingMedium,
    fontSize: typography.textBase,
    fontVariant: ["tabular-nums"],
  },
  income: { color: colors.sage },
});

import { Pressable, StyleSheet, View } from "react-native";
import { format, parseISO } from "date-fns";

import type { V2Transaction } from "@trove/api/v2/contracts";

import { Text } from "@/ui/text";
import { colors, spacing, typography } from "@/ui/design-tokens";
import { Icon, type IconName } from "@/ui/icon";
import { formatMoneyMinor } from "@/utils/money";

interface HomeTransactionRowProps {
  readonly transaction: V2Transaction;
  readonly onPress?: (transaction: V2Transaction) => void;
  readonly categoryName?: string;
}

const transactionIcons = {
  income: "arrow-down-left",
  expense: "arrow-up-right",
  transfer: "arrows-left-right",
} satisfies Record<V2Transaction["kind"], IconName>;

export function HomeTransactionRow({
  transaction,
  onPress,
  categoryName,
}: HomeTransactionRowProps) {
  const sign = transaction.kind === "income" ? "+" : transaction.kind === "expense" ? "−" : "";
  const label = transaction.note.trim() || categoryName || "Transaction";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${label}`}
      onPress={() => onPress?.(transaction)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.iconWrap}>
        <Icon
          name={transactionIcons[transaction.kind]}
          size={18}
          color={colors.foreground}
          weight="regular"
        />
      </View>
      <View style={styles.copy}>
        <Text numberOfLines={1} style={styles.label}>
          {label}
        </Text>
        <Text numberOfLines={1} style={styles.date}>
          {format(parseISO(transaction.date), "d MMM")}
          {categoryName ? ` · ${categoryName}` : ""}
        </Text>
      </View>
      <Text style={styles.amount}>
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
    minHeight: 64,
    paddingVertical: spacing[2],
  },
  pressed: { opacity: 0.6 },
  iconWrap: {
    alignItems: "center",
    backgroundColor: colors.muted,
    borderColor: colors.border,
    borderRadius: 11,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  copy: { flex: 1, gap: spacing[0.5] },
  label: {
    color: colors.foreground,
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textBase,
  },
  date: {
    color: colors.mutedForeground,
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textXs,
  },
  amount: {
    color: colors.foreground,
    fontFamily: typography.fontHeadingMedium,
    fontSize: typography.textBase,
    fontVariant: ["tabular-nums"],
  },
});

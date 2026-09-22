import { ArrowDownLeftIcon, ArrowUpRightIcon, ArrowsLeftRightIcon } from "phosphor-react-native";
import { Pressable, StyleSheet, View } from "react-native";
import { format, parseISO } from "date-fns";

import type { V2Transaction } from "@trove/api/v2/contracts";

import { Text } from "@/ui/text";
import { spacing, typography } from "@/ui/design-tokens";
import { tileColors } from "@/ui/tiled-garden/tile-tokens";
import { formatMoneyMinor } from "@/utils/money";

interface HomeTransactionRowProps {
  readonly transaction: V2Transaction;
  readonly onPress?: (transaction: V2Transaction) => void;
  readonly categoryName?: string;
}

const iconFor = (kind: V2Transaction["kind"]) => {
  if (kind === "income") return ArrowDownLeftIcon;
  if (kind === "transfer") return ArrowsLeftRightIcon;
  return ArrowUpRightIcon;
};

export function HomeTransactionRow({
  transaction,
  onPress,
  categoryName,
}: HomeTransactionRowProps) {
  const Icon = iconFor(transaction.kind);
  const iconColor = tileColors.ink;
  const sign = transaction.kind === "income" ? "+" : transaction.kind === "expense" ? "−" : "";
  const amountColor = tileColors.ink;
  const label = transaction.note.trim() || categoryName || "Transaction";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${label}`}
      onPress={() => onPress?.(transaction)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.iconWrap}>
        <Icon size={18} color={iconColor} weight="regular" />
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
      <Text style={[styles.amount, { color: amountColor }]}>
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
    backgroundColor: tileColors.olive,
    borderColor: tileColors.grout,
    borderRadius: 11,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  copy: { flex: 1, gap: spacing[0.5] },
  label: {
    color: tileColors.ink,
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textBase,
  },
  date: {
    color: tileColors.muted,
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textXs,
  },
  amount: {
    fontFamily: typography.fontHeadingMedium,
    fontSize: typography.textBase,
    fontVariant: ["tabular-nums"],
  },
});

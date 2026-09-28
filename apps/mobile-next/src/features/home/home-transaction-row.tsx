import { Pressable, StyleSheet, View } from "react-native";
import { format, parseISO } from "date-fns";

import type { V2Category, V2Transaction } from "@trove/api/v2/contracts";

import { Text } from "@/ui/text";
import { colors, spacing, typography } from "@/ui/design-tokens";
import { CategoryAvatar } from "@/features/ledger/list/category-avatar";
import { ledgerRowDisplay } from "@/features/ledger/list/ledger-row-display";

interface HomeTransactionRowProps {
  readonly transaction: V2Transaction;
  readonly onPress?: (transaction: V2Transaction) => void;
  readonly category?: V2Category;
}

/** Latest-activity row: the Category's emoji on its color wash, same as the Ledger tab. */
export function HomeTransactionRow({ transaction, onPress, category }: HomeTransactionRowProps) {
  const display = ledgerRowDisplay(transaction, { category });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${display.title}`}
      onPress={() => onPress?.(transaction)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <CategoryAvatar emoji={display.emoji} tint={display.tint} icon={display.icon} size={36} />
      <View style={styles.copy}>
        <Text numberOfLines={1} style={styles.label}>
          {display.title}
        </Text>
        <Text numberOfLines={1} style={styles.date}>
          {format(parseISO(transaction.date), "d MMM")}
          {display.meta ? ` · ${display.meta}` : ""}
        </Text>
      </View>
      <Text style={[styles.amount, styles[display.tone]]}>{display.amount}</Text>
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
    fontFamily: typography.fontHeadingMedium,
    fontSize: typography.textBase,
    fontVariant: ["tabular-nums"],
  },
  income: { color: colors.sage },
  expense: { color: colors.foreground },
  transfer: { color: colors.mutedForeground },
});

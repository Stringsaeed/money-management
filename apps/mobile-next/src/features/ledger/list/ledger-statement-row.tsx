import { format } from "date-fns";
import { Pressable, StyleSheet, View } from "react-native";

import type { V2Transaction } from "@trove/api/v2/contracts";

import { Text } from "@/ui/text";
import { colors, spacing, typography } from "@/ui/design-tokens";
import { parseDateKey } from "@/utils/date";

import type { LedgerRowDisplay } from "./ledger-row-display";

interface LedgerStatementRowProps {
  readonly transaction: V2Transaction;
  readonly display: LedgerRowDisplay;
  readonly onPress?: (transaction: V2Transaction) => void;
}

/** Dense bank-statement line: a date column, one line of copy, and a right-aligned amount. */
export function LedgerStatementRow({ transaction, display, onPress }: LedgerStatementRowProps) {
  const date = parseDateKey(transaction.date);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${display.title}, ${display.amount}`}
      onPress={() => onPress?.(transaction)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.date}>
        <Text style={styles.day}>{date ? format(date, "dd") : "—"}</Text>
        <Text style={styles.weekday}>{date ? format(date, "EEE") : ""}</Text>
      </View>
      <View style={styles.copy}>
        <Text numberOfLines={1} style={styles.title}>
          {display.emoji ? `${display.emoji}  ` : ""}
          {display.title}
        </Text>
        {display.meta ? (
          <Text numberOfLines={1} style={styles.meta}>
            {display.meta}
          </Text>
        ) : null}
      </View>
      <Text style={[styles.amount, styles[display.tone]]}>{display.amount}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    borderBottomColor: colors.ledgerOutline,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: spacing[3],
    minHeight: 52,
    paddingVertical: spacing[1.5],
  },
  pressed: { backgroundColor: colors.surfaceContainer },
  date: { alignItems: "center", width: 32 },
  day: {
    color: colors.foreground,
    fontFamily: typography.fontHeadingBold,
    fontSize: typography.textLg,
    fontVariant: ["tabular-nums"],
    lineHeight: 20,
  },
  weekday: {
    color: colors.mutedForeground,
    fontFamily: typography.fontBodySemibold,
    fontSize: 10,
    textTransform: "uppercase",
  },
  copy: { flex: 1, gap: 1 },
  title: {
    color: colors.foreground,
    fontFamily: typography.fontBodyMedium,
    fontSize: typography.textBase,
  },
  meta: {
    color: colors.mutedForeground,
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textXs,
  },
  amount: {
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textBase,
    fontVariant: ["tabular-nums"],
  },
  income: { color: colors.sage },
  expense: { color: colors.foreground },
  transfer: { color: colors.mutedForeground },
});

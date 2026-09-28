import { Pressable, StyleSheet, View } from "react-native";

import type { V2Transaction } from "@trove/api/v2/contracts";

import { Text } from "@/ui/text";
import { colors, spacing, typography } from "@/ui/design-tokens";

import { CategoryAvatar } from "./category-avatar";
import type { LedgerRowDisplay } from "./ledger-row-display";

interface LedgerRowProps {
  readonly transaction: V2Transaction;
  readonly display: LedgerRowDisplay;
  readonly onPress?: (transaction: V2Transaction) => void;
  readonly divider?: boolean;
}

/** Comfortable Transaction row: Category avatar, title over meta, signed amount. */
export function LedgerRow({ transaction, display, onPress, divider = false }: LedgerRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${display.title}, ${display.amount}`}
      onPress={() => onPress?.(transaction)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <CategoryAvatar emoji={display.emoji} tint={display.tint} icon={display.icon} />
      <View style={[styles.body, divider && styles.divider]}>
        <View style={styles.copy}>
          <Text numberOfLines={1} style={styles.title}>
            {display.title}
          </Text>
          {display.meta ? (
            <Text numberOfLines={1} style={styles.meta}>
              {display.meta}
            </Text>
          ) : null}
        </View>
        <Text style={[styles.amount, styles[display.tone]]}>{display.amount}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: "center", flexDirection: "row", gap: spacing[3], minHeight: 64 },
  pressed: { opacity: 0.6 },
  body: {
    alignItems: "center",
    alignSelf: "stretch",
    flex: 1,
    flexDirection: "row",
    gap: spacing[3],
  },
  divider: { borderBottomColor: colors.ledgerOutline, borderBottomWidth: StyleSheet.hairlineWidth },
  copy: { flex: 1, gap: spacing[0.5] },
  title: {
    color: colors.foreground,
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textBase,
  },
  meta: {
    color: colors.mutedForeground,
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textXs,
  },
  amount: {
    fontFamily: typography.fontHeadingSemibold,
    fontSize: typography.textBase,
    fontVariant: ["tabular-nums"],
  },
  income: { color: colors.sage },
  expense: { color: colors.foreground },
  transfer: { color: colors.mutedForeground },
});

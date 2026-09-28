import { Pressable, ScrollView, StyleSheet } from "react-native";

import type { V2Account } from "@trove/api/v2/contracts";

import { Icon } from "@/ui/icon";
import { Text } from "@/ui/text";
import { colors, radii, spacing, typography } from "@/ui/design-tokens";
import { formatMoneyMinor } from "@/utils/money";

interface AccountStripProps {
  readonly accounts: readonly V2Account[];
  readonly selectedIds: readonly string[];
  readonly onToggle: (id: string) => void;
  readonly onAdd?: () => void;
  readonly inset: number;
}

/** Account balance cards that double as the Account filter. */
export function AccountStrip({ accounts, selectedIds, onToggle, onAdd, inset }: AccountStripProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.row, { paddingHorizontal: inset }]}
      style={{ marginHorizontal: -inset }}
    >
      {accounts.map((account) => {
        const selected = selectedIds.includes(account.id);
        return (
          <Pressable
            key={account.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`${account.name}, ${formatMoneyMinor(account.balanceMinor, account.currency)}`}
            onPress={() => onToggle(account.id)}
            style={({ pressed }) => [
              styles.card,
              selected && styles.selected,
              pressed && styles.pressed,
            ]}
          >
            <Text numberOfLines={1} style={[styles.name, selected && styles.selectedText]}>
              {account.name}
            </Text>
            <Text numberOfLines={1} style={[styles.balance, selected && styles.selectedText]}>
              {formatMoneyMinor(account.balanceMinor, account.currency)}
            </Text>
            <Text style={[styles.type, selected && styles.selectedText]}>
              {account.type.replace("_", " ")}
            </Text>
          </Pressable>
        );
      })}
      {onAdd ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add account"
          onPress={onAdd}
          style={({ pressed }) => [styles.card, styles.add, pressed && styles.pressed]}
        >
          <Icon name="plus" size={20} color={colors.mutedForeground} />
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing[2] },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderCurve: "continuous",
    borderRadius: radii["2xl"],
    borderWidth: 1,
    gap: spacing[1],
    minWidth: 148,
    padding: spacing[4],
  },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
  pressed: { opacity: 0.75 },
  add: { alignItems: "center", justifyContent: "center", minWidth: 64 },
  name: {
    color: colors.mutedForeground,
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textXs,
  },
  balance: {
    color: colors.foreground,
    fontFamily: typography.fontHeadingBold,
    fontSize: typography.textXl,
    fontVariant: ["tabular-nums"],
  },
  type: {
    color: colors.mutedForeground,
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textXs,
    textTransform: "capitalize",
  },
  selectedText: { color: colors.primaryForeground },
});

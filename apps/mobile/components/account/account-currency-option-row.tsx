import { CheckIcon } from "phosphor-react-native";
import { Pressable, StyleSheet, View } from "react-native";

import type { AccountCurrencyOption } from "@/components/account/account-currency-utils";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { colors, radii, spacing, typography } from "@/lib/design-tokens";

interface AccountCurrencyOptionRowProps {
  item: AccountCurrencyOption;
  selected: boolean;
  onSelect: (code: string) => void;
}

export function AccountCurrencyOptionRow({
  item,
  selected,
  onSelect,
}: AccountCurrencyOptionRowProps) {
  return (
    <Pressable
      accessibilityLabel={`${item.code}, ${item.name}`}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.container, selected ? styles.containerSelected : styles.containerUnselected]}
      onPress={() => onSelect(item.code)}
      testID={`account-currency-option-${item.code}`}
    >
      {item.symbol ? (
        <View
          style={[
            styles.symbolBadge,
            selected ? styles.symbolBadgeSelected : styles.symbolBadgeUnselected,
          ]}
        >
          <Text style={[styles.symbolText, selected ? styles.textOnInk : styles.textOnSurface]}>
            {item.symbol}
          </Text>
        </View>
      ) : null}
      <View style={styles.labelContainer}>
        <Text style={[styles.codeText, selected ? styles.textOnInk : styles.textOnSurface]}>
          {item.code}
        </Text>
        <Text
          style={[styles.nameText, selected ? styles.nameTextSelected : styles.nameTextUnselected]}
        >
          {item.name}
        </Text>
      </View>
      {selected ? <Icon as={CheckIcon} style={styles.checkIcon} size={18} weight="bold" /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    borderRadius: radii.xl,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  containerSelected: {
    backgroundColor: colors.ink,
  },
  containerUnselected: {
    backgroundColor: colors.surfaceContainer,
  },
  symbolBadge: {
    minWidth: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.lg,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1.5],
  },
  symbolBadgeSelected: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  symbolBadgeUnselected: {
    backgroundColor: colors.surface,
  },
  symbolText: {
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textSm,
  },
  labelContainer: {
    minWidth: 0,
    flex: 1,
  },
  codeText: {
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textBase,
  },
  nameText: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textSm,
  },
  nameTextSelected: {
    color: colors.surface,
    opacity: 0.7,
  },
  nameTextUnselected: {
    color: colors.ink,
    opacity: 0.5,
  },
  textOnInk: {
    color: colors.surface,
  },
  textOnSurface: {
    color: colors.ink,
  },
  checkIcon: {
    color: colors.surface,
  },
});

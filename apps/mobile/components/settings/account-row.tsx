import { CaretRightIcon } from "phosphor-react-native";
import { Pressable, StyleSheet, View } from "react-native";

import { ACCOUNT_TYPE_META } from "@/components/account/account-form-options";
import { accountDisplayIcon } from "@/components/account/utils";
import { Icon } from "@/components/ui/icon";
import { MoneyText } from "@/components/ui/money-text";
import { Text } from "@/components/ui/text";
import { colors, radii, spacing, typography } from "@/lib/design-tokens";

import type { AccountRowProps } from "./types";

export function AccountRow({ account, onPress }: AccountRowProps) {
  const typeMeta = ACCOUNT_TYPE_META[account.type];

  return (
    <Pressable
      aria-label={account.lifecycle === "archived" ? `${account.name}, Archived` : account.name}
      role="button"
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.containerPressed]}
    >
      <View style={[styles.iconCircle, { backgroundColor: `${account.color}20` }]}>
        <Text style={styles.iconText}>{accountDisplayIcon(account)}</Text>
      </View>
      <View style={styles.labelContainer}>
        <Text style={styles.nameText}>{account.name}</Text>
        <Text style={styles.subtitleText}>
          {typeMeta?.label ?? account.type} · {account.currency}
        </Text>
      </View>
      {account.lifecycle === "archived" ? <Text style={styles.archivedBadge}>Archived</Text> : null}
      <MoneyText
        cents={Math.abs(account.balance)}
        currency={account.currency}
        sign={account.balance < 0 ? "-" : ""}
        style={[
          styles.amountText,
          account.balance < 0 ? styles.amountNegative : styles.amountPositive,
        ]}
      />
      <Icon as={CaretRightIcon} style={styles.caretIcon} size={16} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3.5],
    gap: spacing[3],
    backgroundColor: colors.surfaceContainer,
  },
  containerPressed: {
    backgroundColor: colors.surfaceDim,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    fontSize: typography.textBase,
  },
  labelContainer: {
    flex: 1,
  },
  nameText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: typography.textBase,
    color: colors.ink,
  },
  subtitleText: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textXs,
    color: colors.ink,
    opacity: 0.4,
    marginTop: spacing[0.5],
  },
  archivedBadge: {
    fontFamily: typography.fontBodyMedium,
    fontSize: typography.textXs,
    color: colors.ink,
    opacity: 0.4,
  },
  amountText: {
    fontFamily: typography.fontHeadingNormal,
    fontSize: typography.textBase,
    fontVariant: ["tabular-nums"],
  },
  amountPositive: {
    color: colors.ink,
  },
  amountNegative: {
    color: colors.terracotta,
  },
  caretIcon: {
    color: colors.ink,
    opacity: 0.2,
    marginLeft: spacing[1],
  },
});

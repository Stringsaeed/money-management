import { router } from "expo-router";
import { Pressable, StyleSheet, useColorScheme, View } from "react-native";
import { SymbolView } from "expo-symbols";

import { MoneyText } from "@/components/ui/money-text";
import { Text } from "@/components/ui/text";
import { colors, rawColorValues, spacing, typography } from "@/lib/design-tokens";
import type { TransactionWithDetails } from "@/types";

interface TransactionRowProps {
  transaction: TransactionWithDetails;
  showAccount?: boolean;
}

export function TransactionRow({ transaction: t, showAccount = false }: TransactionRowProps) {
  const isIncome = t.type === "income";
  const isTransfer = t.type === "transfer";
  const colorScheme = useColorScheme();

  const amountStyle = isTransfer
    ? styles.amountTransfer
    : isIncome
      ? styles.amountIncome
      : styles.amountDefault;

  const iconBgStyle = isIncome
    ? styles.iconBgIncome
    : isTransfer
      ? styles.iconBgTransfer
      : styles.iconBgExpense;

  const iconColor = isIncome
    ? colorScheme === "dark"
      ? rawColorValues.dark.sage
      : rawColorValues.light.sage
    : isTransfer
      ? colorScheme === "dark"
        ? "#6B6966"
        : "#9CA3AF"
      : colorScheme === "dark"
        ? rawColorValues.dark.terracotta
        : rawColorValues.light.terracotta;

  const amountPrefix = isIncome ? "+" : isTransfer ? "" : "-";

  return (
    <Pressable
      onPress={() => router.push(`/transaction/${t.id}`)}
      style={({ pressed }) => [styles.container, pressed && styles.containerPressed]}
    >
      <View style={[styles.iconContainer, iconBgStyle]}>
        {t.category?.icon ? (
          <Text style={styles.categoryIcon}>{t.category.icon}</Text>
        ) : (
          <SymbolView
            name={
              isIncome
                ? "arrow.down.left"
                : isTransfer
                  ? "arrow.left.arrow.right"
                  : "arrow.up.right"
            }
            size={16}
            tintColor={iconColor}
          />
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.description} numberOfLines={1}>
          {t.description || t.category?.name || (isTransfer ? "Transfer" : "Transaction")}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {t.category?.name ?? (isTransfer ? "Transfer" : "")}
          {showAccount && t.account?.name ? ` · ${t.account.name}` : ""}
          {isTransfer && t.toAccount ? ` → ${t.toAccount.name}` : ""}
        </Text>
      </View>

      <MoneyText
        cents={t.amount}
        currency={t.currency}
        sign={amountPrefix}
        style={[styles.amount, amountStyle]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3.5],
    gap: spacing[3],
  },
  containerPressed: {
    backgroundColor: colors.surfaceContainer,
    opacity: 0.5,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBgIncome: {
    backgroundColor: colors.sage,
    opacity: 0.1,
  },
  iconBgTransfer: {
    backgroundColor: colors.ink,
    opacity: 0.05,
  },
  iconBgExpense: {
    backgroundColor: colors.terracotta,
    opacity: 0.1,
  },
  categoryIcon: {
    fontSize: 17,
  },
  content: {
    flex: 1,
    gap: spacing[0.5],
  },
  description: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 15,
    color: colors.ink,
  },
  subtitle: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textXs,
    color: colors.ink,
    opacity: 0.6,
  },
  amount: {
    fontFamily: typography.fontHeadingNormal,
    fontSize: 15,
    fontVariant: ["tabular-nums"],
  },
  amountDefault: {
    color: colors.ink,
  },
  amountIncome: {
    color: colors.sage,
  },
  amountTransfer: {
    color: colors.ink,
    opacity: 0.6,
  },
});

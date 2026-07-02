import { router } from "expo-router";
import { Pressable, useColorScheme, View } from "react-native";
import { Text } from "@/components/ui/text";
import { SymbolView } from "expo-symbols";

import { formatCents } from "@/utils/currency";
import type { TransactionWithDetails } from "@/types";

interface TransactionRowProps {
  transaction: TransactionWithDetails;
  showAccount?: boolean;
}

export function TransactionRow({ transaction: t, showAccount = false }: TransactionRowProps) {
  const isIncome = t.type === "income";
  const isTransfer = t.type === "transfer";
  const colorScheme = useColorScheme();

  const amountColor = isTransfer ? "text-ink/60" : isIncome ? "text-sage" : "text-ink";
  const iconBg = isIncome ? "bg-sage/10" : isTransfer ? "bg-ink/5" : "bg-terracotta/10";
  const iconColor = isIncome
    ? colorScheme === "dark"
      ? "#9DB493"
      : "#8B9D83"
    : isTransfer
      ? colorScheme === "dark"
        ? "#6B6966"
        : "#9CA3AF"
      : colorScheme === "dark"
        ? "#C99E8E"
        : "#B48A7B";

  const amountPrefix = isIncome ? "+" : isTransfer ? "" : "-";

  return (
    <Pressable
      onPress={() => router.push(`/transaction/${t.id}`)}
      className="flex-row items-center px-5 py-3.5 gap-3 active:bg-surface-container/50"
    >
      {/* Type indicator */}
      <View className={`w-9 h-9 rounded-full items-center justify-center ${iconBg}`}>
        {t.category?.icon ? (
          <Text className="text-[17px]">{t.category.icon}</Text>
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

      {/* Description + subtitle */}
      <View className="flex-1 gap-0.5">
        <Text className="font-body-medium text-[15px] text-ink" numberOfLines={1}>
          {t.description || t.category?.name || (isTransfer ? "Transfer" : "Transaction")}
        </Text>
        <Text className="font-body-normal text-xs text-ink/60" numberOfLines={1}>
          {t.category?.name ?? (isTransfer ? "Transfer" : "")}
          {showAccount && t.account?.name ? ` · ${t.account.name}` : ""}
          {isTransfer && t.toAccount ? ` → ${t.toAccount.name}` : ""}
        </Text>
      </View>

      {/* Amount */}
      <Text
        className={`font-heading-normal text-[15px] ${amountColor}`}
        style={{ fontVariant: ["tabular-nums"] }}
      >
        {amountPrefix}
        {formatCents(t.amount, t.currency)}
      </Text>
    </Pressable>
  );
}

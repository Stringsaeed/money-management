import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { CategoryBadge } from "@/components/category/category-badge";
import { formatCents } from "@/utils/currency";
import type { TransactionWithDetails } from "@/types";

interface TransactionRowProps {
  transaction: TransactionWithDetails;
  showAccount?: boolean;
}

export function TransactionRow({ transaction: t, showAccount = false }: TransactionRowProps) {
  const isIncome = t.type === "income";
  const isTransfer = t.type === "transfer";

  const amountClass = isTransfer ? "text-violet-600" : isIncome ? "text-green-600" : "text-red-600";

  const amountPrefix = isIncome ? "+" : isTransfer ? "⇄ " : "-";
  const dotColor = t.category?.color ?? t.account.color;

  return (
    <Pressable
      onPress={() => router.push(`/transaction/${t.id}`)}
      className="flex-row items-center px-4 py-3 gap-3 active:bg-gray-50"
    >
      {/* Icon circle */}
      <View
        style={{ backgroundColor: `${dotColor}20` }}
        className="w-10 h-10 rounded-full items-center justify-center"
      >
        <View style={{ backgroundColor: dotColor }} className="w-3.5 h-3.5 rounded-full" />
      </View>

      {/* Description + tags */}
      <View className="flex-1 gap-0.5">
        <Text className="text-[15px] font-medium text-gray-900" numberOfLines={1}>
          {t.description || t.category?.name || (isTransfer ? "Transfer" : "Transaction")}
        </Text>
        <View className="flex-row gap-1.5 items-center flex-wrap">
          {t.category ? (
            <CategoryBadge name={t.category.name} color={t.category.color} size="sm" />
          ) : null}
          {isTransfer && t.toAccount ? (
            <Text className="text-[11px] text-gray-500">→ {t.toAccount.name}</Text>
          ) : null}
          {showAccount ? <Text className="text-[11px] text-gray-500">{t.account.name}</Text> : null}
        </View>
      </View>

      {/* Amount */}
      <Text
        className={`text-base font-semibold ${amountClass}`}
        style={{ fontVariant: ["tabular-nums"] }}
      >
        {amountPrefix}
        {formatCents(t.amount, t.currency)}
      </Text>
    </Pressable>
  );
}

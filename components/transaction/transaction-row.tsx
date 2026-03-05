import { router } from "expo-router";
import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";

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
  return (
    <Pressable
      onPress={() => router.push(`/transaction/${t.id}`)}
      className="flex-row items-center px-4 py-3 gap-3 active:bg-gray-50"
    >
      {/* Category emoji */}
      <View className="w-10 h-10 rounded-full items-center justify-center bg-gray-100">
        <Text className="text-[20px] leading-none">
          {t.category?.icon ?? (isTransfer ? "⇄" : "💰")}
        </Text>
      </View>

      {/* Description + tags */}
      <View className="flex-1 gap-0.5">
        <Text className="text-[15px] font-medium text-gray-900" numberOfLines={1}>
          {t.description || t.category?.name || (isTransfer ? "Transfer" : "Transaction")}
        </Text>
        <View className="flex-row gap-1.5 items-center flex-wrap">
          {isTransfer && t.toAccount ? (
            <Text className="text-[11px] text-gray-500">→ {t.toAccount.name}</Text>
          ) : null}
          {showAccount ? <Text className="text-[11px] text-gray-500">{t.account.name}</Text> : null}
        </View>
      </View>

      {/* Amount */}
      <Text
        className={`text-base font-semibold tabular-nums ${amountClass}`}
        style={{ fontVariant: ["tabular-nums"] }}
      >
        {amountPrefix}
        {formatCents(t.amount, t.currency)}
      </Text>
    </Pressable>
  );
}

import { Pressable, Text, View } from "react-native";

import { formatCents } from "@/utils/currency";
import type { AccountWithBalance } from "@/types";

interface AccountCardProps {
  account: AccountWithBalance;
  onPress?: () => void;
  compact?: boolean;
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  checking: "💳 Checking",
  savings: "🏦 Savings",
  cash: "💵 Cash",
  credit_card: "💳 Credit Card",
  investment: "📈 Investment",
  other: "🏧 Other",
};

export function AccountCard({ account, onPress, compact = false }: AccountCardProps) {
  const isNegative = account.balance < 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: account.color,
        opacity: pressed ? 0.85 : 1,
        borderCurve: "continuous",
        boxShadow: `0 4px 16px ${account.color}50`,
      })}
      className={`rounded-2xl ${compact ? "p-3.5 min-w-[140px]" : "p-5"}`}
    >
      <View className="flex-row justify-between items-start">
        <Text className="text-white/80 text-xs font-medium">
          {ACCOUNT_TYPE_LABELS[account.type] ?? account.type}
        </Text>
        <Text className="text-white/80 text-xs">{account.currency}</Text>
      </View>
      <Text
        className={`text-white font-semibold mt-2 mb-1 ${compact ? "text-base" : "text-sm"}`}
        numberOfLines={1}
      >
        {account.name}
      </Text>
      <Text
        className={`text-white font-bold ${compact ? "text-xl" : "text-[28px]"}`}
        style={{ fontVariant: ["tabular-nums"] }}
      >
        {isNegative ? "-" : ""}
        {formatCents(Math.abs(account.balance), account.currency)}
      </Text>
    </Pressable>
  );
}

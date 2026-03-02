import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";

import { formatCents } from "@/utils/currency";
import type { AccountWithBalance } from "@/types";
import { twMerge } from "tailwind-merge";

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
      className={twMerge(
        `rounded-2xl p-5 opacity-100 active:opacity-85`,
        compact && "p-3.5 min-w-35",
      )}
      style={{
        backgroundColor: account.color,
        borderCurve: "continuous",
        boxShadow: `0 4px 16px ${account.color}50`,
      }}
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

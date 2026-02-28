import { Pressable, Text, View } from "react-native";

import { formatCents } from "@/utils/currency";
import type { AccountWithBalance } from "@/types";

interface AccountCardProps {
  account: AccountWithBalance;
  onPress?: () => void;
  compact?: boolean;
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  checking: "Checking",
  savings: "Savings",
  cash: "Cash",
  credit_card: "Credit Card",
  investment: "Investment",
  other: "Other",
};

export function AccountCard({ account, onPress, compact = false }: AccountCardProps) {
  const isNegative = account.balance < 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: account.color,
        borderRadius: 16,
        padding: compact ? 14 : 20,
        opacity: pressed ? 0.85 : 1,
        minWidth: compact ? 140 : undefined,
      })}
    >
      <View
        style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}
      >
        <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: "500" }}>
          {ACCOUNT_TYPE_LABELS[account.type] ?? account.type}
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>{account.currency}</Text>
      </View>
      <Text
        style={{
          color: "white",
          fontSize: compact ? 16 : 14,
          fontWeight: "600",
          marginTop: 8,
          marginBottom: 4,
        }}
        numberOfLines={1}
      >
        {account.name}
      </Text>
      <Text
        style={{
          color: "white",
          fontSize: compact ? 20 : 28,
          fontWeight: "700",
        }}
      >
        {isNegative ? "-" : ""}
        {formatCents(Math.abs(account.balance), account.currency)}
      </Text>
    </Pressable>
  );
}

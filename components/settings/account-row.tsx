import { router } from "expo-router";
import { CaretRightIcon } from "phosphor-react-native";
import { Pressable, View } from "react-native";

import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { formatCents } from "@/utils/currency";

import type { AccountRowProps } from "./types";

const ACCOUNT_EMOJI: Record<string, string> = {
  checking: "💳",
  savings: "🏦",
  cash: "💵",
  credit_card: "💳",
  investment: "📈",
  other: "🏧",
};

const ACCOUNT_LABEL: Record<string, string> = {
  checking: "Checking",
  savings: "Savings",
  cash: "Cash",
  credit_card: "Credit Card",
  investment: "Investment",
  other: "Other",
};

export function AccountRow({ account }: AccountRowProps) {
  return (
    <Pressable
      onPress={() => router.push(`/account/${account.id}`)}
      className="flex-row items-center px-4 py-3.5 gap-3 active:bg-surface-dim"
    >
      <View
        style={{ backgroundColor: `${account.color}20` }}
        className="w-9 h-9 rounded-full items-center justify-center"
      >
        <Text className="text-base">{ACCOUNT_EMOJI[account.type] ?? "🏧"}</Text>
      </View>
      <View className="flex-1">
        <Text className="font-body-medium text-base text-ink">{account.name}</Text>
        <Text className="font-body-normal text-xs text-ink/40 mt-0.5">
          {ACCOUNT_LABEL[account.type] ?? account.type} · {account.currency}
        </Text>
      </View>
      <Text
        className={cn(
          "font-heading-normal text-base",
          account.balance < 0 ? "text-terracotta" : "text-ink",
        )}
        style={{ fontVariant: ["tabular-nums"] }}
      >
        {account.balance < 0 ? "-" : ""}
        {formatCents(Math.abs(account.balance), account.currency)}
      </Text>
      <Icon as={CaretRightIcon} className="text-ink/20 ml-1" size={16} />
    </Pressable>
  );
}

import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Pressable, ScrollView, useColorScheme, View } from "react-native";

import { Text } from "@/components/ui/text";
import { formatCents } from "@/utils/currency";

import type { AccountsSectionProps } from "./types";

const ACCOUNT_TYPE_EMOJI: Record<string, string> = {
  cash: "💵",
  bank: "🏦",
  credit: "💳",
  investment: "📈",
};

function getAccountEmoji(type: string): string {
  return ACCOUNT_TYPE_EMOJI[type] ?? "💰";
}

export function AccountsSection({ accounts }: AccountsSectionProps) {
  const colorScheme = useColorScheme();
  if (accounts.length === 0) return null;

  return (
    <View className="mt-4">
      {/* Section header */}
      <View className="flex-row items-center justify-between px-5 pb-3 border-b border-ledger-outline mx-5">
        <Text className="font-heading-normal text-xl italic text-ink">Primary Positions</Text>
        <Pressable
          onPress={() => router.push("/(tabs)/accounts")}
          className="flex-row items-center gap-1"
        >
          <Text className="font-body-semibold text-[11px] text-ink/40 uppercase tracking-wide">
            View All
          </Text>
          <SymbolView
            name="arrow.right"
            size={10}
            tintColor={colorScheme === "dark" ? "#6B6966" : "#9CA3AF"}
          />
        </Pressable>
      </View>

      {/* Horizontal scroll of account cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingTop: 16, paddingBottom: 8 }}
      >
        {accounts.map((account) => (
          <Pressable
            key={account.id}
            onPress={() => router.push(`/account/${account.id}`)}
            className="w-[130px] p-4 border border-ledger-outline gap-3 active:bg-surface-container"
            style={{ borderCurve: "continuous" }}
          >
            <View className="w-10 h-10 bg-surface-container rounded-full items-center justify-center">
              <Text className="text-lg">{getAccountEmoji(account.type)}</Text>
            </View>
            <View>
              <Text className="font-body-medium text-[11px] text-ink/40 uppercase tracking-tight">
                {account.name}
              </Text>
              <Text
                className="font-heading-normal text-base text-ink"
                style={{ fontVariant: ["tabular-nums"] }}
              >
                {formatCents(account.balance, account.currency)}
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

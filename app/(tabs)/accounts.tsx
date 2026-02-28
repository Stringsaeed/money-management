import { router } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import Animated, { Easing, FadeInDown, LinearTransition } from "react-native-reanimated";

import { AccountCard } from "@/components/account/account-card";
import { EmptyState } from "@/components/common/empty-state";
import { useAccountsWithBalances } from "@/hooks/use-accounts";
import { formatCents } from "@/utils/currency";
import type { AccountWithBalance } from "@/types";

// ─── Sub-components ──────────────────────────────────────────────────────────

interface AccountsHeaderProps {
  accounts: AccountWithBalance[];
}

function AccountsHeader({ accounts }: AccountsHeaderProps) {
  const currencies = [...new Set(accounts.map((a) => a.currency))];
  const hasMixedCurrencies = currencies.length > 1;

  return (
    <View className="bg-white pt-safe-offset-2 pb-4 px-5 border-b border-gray-100">
      <View className="flex-row justify-between items-center">
        <Text className="text-[28px] font-bold text-gray-900">Accounts 🏦</Text>
        <Pressable
          onPress={() => router.push("/account/new")}
          className="bg-[#0a7ea4] rounded-lg px-3 py-1.5"
        >
          <Text className="text-white font-semibold text-sm">＋ New</Text>
        </Pressable>
      </View>

      {accounts.length > 0 && (
        <View className="mt-3 gap-0.5">
          <Text className="text-xs text-gray-500 font-medium uppercase tracking-wide">
            {hasMixedCurrencies ? "Total by currency" : "Net Worth 💰"}
          </Text>
          {hasMixedCurrencies ? (
            currencies.map((cur) => {
              const total = accounts
                .filter((a) => !a.excludeFromTotal && a.currency === cur)
                .reduce((s, a) => s + a.balance, 0);
              return (
                <Text key={cur} className="text-xl font-bold text-gray-900">
                  {formatCents(total, cur)}
                </Text>
              );
            })
          ) : (
            <Text
              className="text-2xl font-bold text-gray-900"
              style={{ fontVariant: ["tabular-nums"] }}
            >
              {formatCents(
                accounts.filter((a) => !a.excludeFromTotal).reduce((s, a) => s + a.balance, 0),
                currencies[0] ?? "USD",
              )}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function AccountsScreen() {
  const { data: accounts = [], isLoading } = useAccountsWithBalances();

  return (
    <View className="flex-1 bg-gray-50">
      <AccountsHeader accounts={accounts} />

      {isLoading ? (
        <ActivityIndicator className="mt-10" />
      ) : accounts.length === 0 ? (
        <EmptyState
          icon="🏦"
          title="No accounts yet"
          message="Add your first account to start tracking your finances."
          action={
            <Pressable
              onPress={() => router.push("/account/new")}
              className="bg-[#0a7ea4] rounded-xl px-5 py-3 mt-1"
            >
              <Text className="text-white font-semibold">＋ Add Account</Text>
            </Pressable>
          }
        />
      ) : (
        <ScrollView contentContainerClassName="p-4 gap-3 pb-28">
          {accounts.map((account, i) => (
            <Animated.View
              key={account.id}
              entering={FadeInDown.delay(i * 60).duration(300)}
              layout={LinearTransition.easing(Easing.ease)}
            >
              <AccountCard
                account={account}
                onPress={() => router.push(`/account/${account.id}`)}
              />
            </Animated.View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

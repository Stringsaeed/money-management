import { router } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import Animated, { Easing, LinearTransition } from "react-native-reanimated";

import { AccountCard } from "@/components/account/account-card";
import { TransactionRow } from "@/components/transaction/transaction-row";
import { useAccountsWithBalances } from "@/hooks/use-accounts";
import { useRecurringProcessor } from "@/hooks/use-recurring-processor";
import { useRecentTransactions } from "@/hooks/use-transactions";
import { formatCents } from "@/utils/currency";
import type { AccountWithBalance, TransactionWithDetails } from "@/types";

// ─── Sub-components ─────────────────────────────────────────────────────────

interface NetWorthHeaderProps {
  accounts: AccountWithBalance[];
  isLoading: boolean;
}

function NetWorthHeader({ accounts, isLoading }: NetWorthHeaderProps) {
  const currencies = [...new Set(accounts.map((a) => a.currency))];
  const hasMixedCurrencies = currencies.length > 1;
  const netWorth = accounts.filter((a) => !a.excludeFromTotal).reduce((s, a) => s + a.balance, 0);

  return (
    <View className="bg-[#0a7ea4] pt-safe-offset-4 pb-7 px-5">
      <Text className="text-white/80 text-sm font-medium mb-1">
        {hasMixedCurrencies ? "Total Balance" : "Net Worth 💰"}
      </Text>

      {isLoading ? (
        <ActivityIndicator color="white" className="mt-2 self-start" />
      ) : hasMixedCurrencies ? (
        <View className="gap-0.5 mt-1">
          {currencies.map((cur) => {
            const total = accounts
              .filter((a) => !a.excludeFromTotal && a.currency === cur)
              .reduce((s, a) => s + a.balance, 0);
            return (
              <Text key={cur} className="text-white text-[22px] font-bold">
                {formatCents(total, cur)}
              </Text>
            );
          })}
        </View>
      ) : (
        <Text
          className="text-white text-4xl font-bold mt-1"
          style={{ fontVariant: ["tabular-nums"] }}
        >
          {formatCents(netWorth, currencies[0] ?? "USD")}
        </Text>
      )}

      <Pressable
        onPress={() => router.push("/transaction/new")}
        className="mt-4 bg-white/20 rounded-xl py-3 items-center active:bg-white/30"
      >
        <Text className="text-white font-semibold text-[15px]">＋ Add Transaction</Text>
      </Pressable>
    </View>
  );
}

interface AccountsSectionProps {
  accounts: AccountWithBalance[];
  isLoading: boolean;
}

function AccountsSection({ accounts, isLoading }: AccountsSectionProps) {
  return (
    <View className="px-5 pt-5">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-[17px] font-bold text-gray-900">Accounts 🏦</Text>
        <Pressable onPress={() => router.push("/account/new")}>
          <Text className="text-[#0a7ea4] text-sm font-semibold">＋ Add</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <Animated.ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          layout={LinearTransition.easing(Easing.ease)}
          style={{ marginHorizontal: -20 }}
          contentContainerClassName="px-5 gap-3"
        >
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onPress={() => router.push(`/account/${account.id}`)}
              compact
            />
          ))}
        </Animated.ScrollView>
      )}
    </View>
  );
}

interface RecentSectionProps {
  transactions: TransactionWithDetails[];
  isLoading: boolean;
}

function RecentSection({ transactions, isLoading }: RecentSectionProps) {
  return (
    <View className="px-5 pt-6">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-[17px] font-bold text-gray-900">Recent 🕐</Text>
        <Pressable onPress={() => router.push("/(tabs)/transactions")}>
          <Text className="text-[#0a7ea4] text-sm font-semibold">See all</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator />
      ) : transactions.length === 0 ? (
        <View
          className="bg-white rounded-2xl p-6 items-center gap-2"
          style={{ borderCurve: "continuous" }}
        >
          <Text className="text-4xl">📋</Text>
          <Text className="text-gray-500 text-center text-sm leading-5">
            No transactions yet.{"\n"}Tap above to add your first one.
          </Text>
        </View>
      ) : (
        <Animated.View
          layout={LinearTransition.easing(Easing.ease)}
          className="bg-white rounded-2xl overflow-hidden"
          style={{ borderCurve: "continuous" }}
        >
          {transactions.map((t, i) => (
            <View key={t.id}>
              {i > 0 && <View className="h-px bg-gray-100 ml-[68px]" />}
              <TransactionRow transaction={t} showAccount />
            </View>
          ))}
        </Animated.View>
      )}
    </View>
  );
}

// ─── Screen ─────────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  useRecurringProcessor();

  const { data: accounts = [], isLoading: loadingAccounts } = useAccountsWithBalances();
  const { data: recent = [], isLoading: loadingRecent } = useRecentTransactions(8);

  if (!loadingAccounts && accounts.length === 0) {
    router.replace("/onboarding");
    return null;
  }

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerClassName="pb-28">
      <NetWorthHeader accounts={accounts} isLoading={loadingAccounts} />
      <AccountsSection accounts={accounts} isLoading={loadingAccounts} />
      <RecentSection transactions={recent} isLoading={loadingRecent} />
    </ScrollView>
  );
}

import { router } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

import { AccountCard } from "@/components/account/account-card";
import { TransactionRow } from "@/components/transaction/transaction-row";
import { useAccountsWithBalances } from "@/hooks/use-accounts";
import { useRecentTransactions } from "@/hooks/use-transactions";
import { useRecurringProcessor } from "@/hooks/use-recurring-processor";
import { formatCents } from "@/utils/currency";
import { Colors } from "@/constants/theme";

export default function DashboardScreen() {
  // Process recurring payments on every app launch
  useRecurringProcessor();

  const { data: accounts = [], isLoading: loadingAccounts } = useAccountsWithBalances();
  const { data: recent = [], isLoading: loadingRecent } = useRecentTransactions(8);

  // Check if this is a first launch (no accounts)
  if (!loadingAccounts && accounts.length === 0) {
    router.replace("/onboarding");
    return null;
  }

  // Group accounts by currency for multi-currency support
  const currencies = [...new Set(accounts.map((a) => a.currency))];
  const hasMixedCurrencies = currencies.length > 1;

  // Net worth: sum of all non-excluded accounts (single currency only)
  const netWorth = accounts
    .filter((a) => !a.excludeFromTotal)
    .reduce((sum, a) => sum + a.balance, 0);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#F9FAFB" }}
      contentContainerStyle={{ paddingBottom: 120 }}
    >
      {/* Net Worth header */}
      <View
        style={{
          backgroundColor: Colors.light.tint,
          paddingTop: 60,
          paddingBottom: 28,
          paddingHorizontal: 20,
        }}
      >
        <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, fontWeight: "500" }}>
          {hasMixedCurrencies ? "Total Balance" : "Net Worth"}
        </Text>
        {loadingAccounts ? (
          <ActivityIndicator color="white" style={{ marginTop: 8 }} />
        ) : hasMixedCurrencies ? (
          <View style={{ marginTop: 4, gap: 2 }}>
            {currencies.map((cur) => {
              const total = accounts
                .filter((a) => !a.excludeFromTotal && a.currency === cur)
                .reduce((s, a) => s + a.balance, 0);
              return (
                <Text key={cur} style={{ color: "white", fontSize: 22, fontWeight: "700" }}>
                  {formatCents(total, cur)}
                </Text>
              );
            })}
          </View>
        ) : (
          <Text style={{ color: "white", fontSize: 36, fontWeight: "700", marginTop: 4 }}>
            {formatCents(netWorth, currencies[0] ?? "USD")}
          </Text>
        )}

        {/* Quick action */}
        <Pressable
          onPress={() => router.push("/transaction/new")}
          style={{
            marginTop: 16,
            backgroundColor: "rgba(255,255,255,0.2)",
            borderRadius: 10,
            paddingVertical: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white", fontWeight: "600", fontSize: 15 }}>+ Add Transaction</Text>
        </Pressable>
      </View>

      {/* Accounts */}
      <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <Text style={{ fontSize: 17, fontWeight: "700", color: "#111827" }}>Accounts</Text>
          <Pressable onPress={() => router.push("/account/new")}>
            <Text style={{ color: Colors.light.tint, fontSize: 14, fontWeight: "600" }}>+ Add</Text>
          </Pressable>
        </View>

        {loadingAccounts ? (
          <ActivityIndicator />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginHorizontal: -20 }}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
          >
            {accounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                onPress={() => router.push(`/account/${account.id}`)}
                compact
              />
            ))}
          </ScrollView>
        )}
      </View>

      {/* Recent Transactions */}
      <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <Text style={{ fontSize: 17, fontWeight: "700", color: "#111827" }}>Recent</Text>
          <Pressable onPress={() => router.push("/(tabs)/transactions")}>
            <Text style={{ color: Colors.light.tint, fontSize: 14, fontWeight: "600" }}>
              See all
            </Text>
          </Pressable>
        </View>

        {loadingRecent ? (
          <ActivityIndicator />
        ) : recent.length === 0 ? (
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 12,
              padding: 24,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#6B7280", textAlign: "center" }}>
              No transactions yet.{"\n"}Tap &quot;+ Add Transaction&quot; above to get started.
            </Text>
          </View>
        ) : (
          <View style={{ backgroundColor: "white", borderRadius: 12, overflow: "hidden" }}>
            {recent.map((t, i) => (
              <View key={t.id}>
                {i > 0 && (
                  <View style={{ height: 1, backgroundColor: "#F3F4F6", marginLeft: 68 }} />
                )}
                <TransactionRow transaction={t} showAccount />
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

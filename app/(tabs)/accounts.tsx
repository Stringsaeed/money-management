import { router } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

import { AccountCard } from "@/components/account/account-card";
import { EmptyState } from "@/components/common/empty-state";
import { useAccountsWithBalances } from "@/hooks/use-accounts";
import { formatCents } from "@/utils/currency";
import { Colors } from "@/constants/theme";

export default function AccountsScreen() {
  const { data: accounts = [], isLoading } = useAccountsWithBalances();

  // Group by currency for multi-currency totals
  const currencies = [...new Set(accounts.map((a) => a.currency))];
  const hasMixedCurrencies = currencies.length > 1;

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: "white",
          paddingTop: 60,
          paddingBottom: 16,
          paddingHorizontal: 20,
          borderBottomWidth: 1,
          borderBottomColor: "#F3F4F6",
        }}
      >
        <View
          style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
        >
          <Text style={{ fontSize: 28, fontWeight: "700", color: "#111827" }}>Accounts</Text>
          <Pressable
            onPress={() => router.push("/account/new")}
            style={{
              backgroundColor: Colors.light.tint,
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}
          >
            <Text style={{ color: "white", fontWeight: "600", fontSize: 14 }}>+ New</Text>
          </Pressable>
        </View>

        {/* Net worth summary */}
        {!isLoading && accounts.length > 0 && (
          <View style={{ marginTop: 12, gap: 2 }}>
            <Text style={{ fontSize: 12, color: "#6B7280", fontWeight: "500" }}>
              {hasMixedCurrencies ? "TOTAL BY CURRENCY" : "NET WORTH"}
            </Text>
            {hasMixedCurrencies ? (
              currencies.map((cur) => {
                const total = accounts
                  .filter((a) => !a.excludeFromTotal && a.currency === cur)
                  .reduce((s, a) => s + a.balance, 0);
                return (
                  <Text key={cur} style={{ fontSize: 20, fontWeight: "700", color: "#111827" }}>
                    {formatCents(total, cur)}
                  </Text>
                );
              })
            ) : (
              <Text style={{ fontSize: 24, fontWeight: "700", color: "#111827" }}>
                {formatCents(
                  accounts.filter((a) => !a.excludeFromTotal).reduce((s, a) => s + a.balance, 0),
                  currencies[0] ?? "USD",
                )}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Account list */}
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : accounts.length === 0 ? (
        <EmptyState
          icon="🏦"
          title="No accounts"
          message="Add your first account to start tracking your finances."
          action={
            <Pressable
              onPress={() => router.push("/account/new")}
              style={{
                backgroundColor: Colors.light.tint,
                borderRadius: 10,
                paddingHorizontal: 20,
                paddingVertical: 12,
              }}
            >
              <Text style={{ color: "white", fontWeight: "600" }}>Add Account</Text>
            </Pressable>
          }
        />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}>
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onPress={() => router.push(`/account/${account.id}`)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

import { router, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, useColorScheme, View } from "react-native";
import { Text } from "@/components/ui/text";

import { TransactionGroup } from "@/components/transaction/transaction-group";
import { useAccount } from "@/hooks/use-accounts";
import { useTransactions } from "@/hooks/use-transactions";
import { useUIStore } from "@/stores/ui-store";
import { formatCents } from "@/utils/currency";
import { formatMonth, addMonths } from "@/utils/date";
import type { DayGroup } from "@/types";

function groupByDay(transactions: import("@/types").TransactionWithDetails[]): DayGroup[] {
  const map = new Map<string, DayGroup>();
  for (const t of transactions) {
    if (!map.has(t.date)) {
      map.set(t.date, { date: t.date, transactions: [], totalIncome: 0, totalExpense: 0 });
    }
    const group = map.get(t.date)!;
    group.transactions.push(t);
    if (t.type === "income") group.totalIncome += t.amount;
    else if (t.type === "expense") group.totalExpense += t.amount;
  }
  return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
}

export default function AccountDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: account, isLoading: loadingAccount } = useAccount(id);
  const { selectedYear, selectedMonth, setSelectedMonth } = useUIStore();
  const colorScheme = useColorScheme();
  const { data: transactions = [], isLoading: loadingTxns } = useTransactions({
    year: selectedYear ?? undefined,
    month: selectedMonth ?? undefined,
    accountId: id,
  });

  if (loadingAccount) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }
  if (!account) return null;

  const groups = groupByDay(transactions);
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  return (
    <ScrollView className="flex-1 bg-background">
      {/* Header */}
      <View
        style={{
          backgroundColor: account.color,
          paddingTop: 60,
          paddingBottom: 24,
          paddingHorizontal: 20,
        }}
      >
        <Pressable onPress={() => router.back()} style={{ marginBottom: 16 }}>
          <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 16 }}>← Back</Text>
        </Pressable>
        <Text style={{ color: "white", fontSize: 14, opacity: 0.8 }}>
          {account.type.replace("_", " ")} · {account.currency}
        </Text>
        <Text style={{ color: "white", fontSize: 24, fontWeight: "700", marginTop: 4 }}>
          {account.name}
        </Text>

        {/* Month nav */}
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 16, gap: 16 }}>
          <Pressable
            onPress={() => {
              if (!selectedYear || !selectedMonth) return;
              const prev = addMonths(selectedYear, selectedMonth, -1);
              setSelectedMonth(prev.year, prev.month);
            }}
          >
            <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 20 }}>‹</Text>
          </Pressable>
          {!!selectedMonth && !!selectedYear && (
            <Text
              style={{
                color: "white",
                fontSize: 15,
                fontWeight: "600",
                flex: 1,
                textAlign: "center",
              }}
            >
              {formatMonth(selectedYear, selectedMonth)}
            </Text>
          )}
          <Pressable
            onPress={() => {
              if (!selectedYear || !selectedMonth) return;
              const next = addMonths(selectedYear, selectedMonth, 1);
              setSelectedMonth(next.year, next.month);
            }}
          >
            <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 20 }}>›</Text>
          </Pressable>
        </View>

        {/* Month summary */}
        <View style={{ flexDirection: "row", marginTop: 16, gap: 20 }}>
          <View>
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>INCOME</Text>
            <Text style={{ color: "white", fontSize: 15, fontWeight: "600" }}>
              +{formatCents(totalIncome, account.currency)}
            </Text>
          </View>
          <View>
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>EXPENSES</Text>
            <Text style={{ color: "white", fontSize: 15, fontWeight: "600" }}>
              -{formatCents(totalExpense, account.currency)}
            </Text>
          </View>
        </View>
      </View>

      {/* Transactions */}
      <View className="py-2">
        {loadingTxns ? (
          <ActivityIndicator className="mt-8" />
        ) : groups.length === 0 ? (
          <Text className="text-center text-muted-foreground mt-12">
            No transactions this month
          </Text>
        ) : (
          groups.map((g) => <TransactionGroup key={g.date} group={g} currency={account.currency} />)
        )}
      </View>

      {/* Add transaction FAB */}
      <Pressable
        onPress={() => router.push("/transaction/new")}
        style={{
          position: "absolute",
          bottom: 32,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: account.color,
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 4px 8px ${colorScheme === "dark" ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.3)"}`,
        }}
      >
        <Text style={{ color: "white", fontSize: 28, lineHeight: 30 }}>+</Text>
      </Pressable>
    </ScrollView>
  );
}

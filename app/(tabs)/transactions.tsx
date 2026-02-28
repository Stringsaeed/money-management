import { router } from "expo-router";
import { ActivityIndicator, Pressable, SectionList, Text, View } from "react-native";

import { TransactionGroup } from "@/components/transaction/transaction-group";
import { EmptyState } from "@/components/common/empty-state";
import { useTransactions, useMonthSummary } from "@/hooks/use-transactions";
import { useUIStore } from "@/stores/ui-store";
import { formatCents } from "@/utils/currency";
import { formatMonth, addMonths } from "@/utils/date";
import { Colors } from "@/constants/theme";
import type { DayGroup, TransactionWithDetails } from "@/types";

function groupByDay(transactions: TransactionWithDetails[]): DayGroup[] {
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

export default function TransactionsScreen() {
  const { selectedYear, selectedMonth, setSelectedMonth } = useUIStore();
  const { data: transactions = [], isLoading } = useTransactions({
    year: selectedYear,
    month: selectedMonth,
  });
  const { data: summary } = useMonthSummary(selectedYear, selectedMonth);

  const groups = groupByDay(transactions);

  // Determine currency from first account currency in transactions
  const currency = transactions[0]?.currency ?? "USD";

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      {/* Month selector + summary */}
      <View
        style={{
          backgroundColor: "white",
          paddingTop: 56,
          paddingHorizontal: 20,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: "#F3F4F6",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
          <Pressable
            onPress={() => {
              const prev = addMonths(selectedYear, selectedMonth, -1);
              setSelectedMonth(prev.year, prev.month);
            }}
            hitSlop={12}
          >
            <Text style={{ fontSize: 22, color: "#6B7280" }}>‹</Text>
          </Pressable>
          <Text
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: 17,
              fontWeight: "700",
              color: "#111827",
            }}
          >
            {formatMonth(selectedYear, selectedMonth)}
          </Text>
          <Pressable
            onPress={() => {
              const next = addMonths(selectedYear, selectedMonth, 1);
              setSelectedMonth(next.year, next.month);
            }}
            hitSlop={12}
          >
            <Text style={{ fontSize: 22, color: "#6B7280" }}>›</Text>
          </Pressable>
        </View>

        {/* Month summary */}
        {summary && (
          <View style={{ flexDirection: "row", gap: 0 }}>
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ fontSize: 11, color: "#6B7280", fontWeight: "500" }}>INCOME</Text>
              <Text style={{ fontSize: 15, fontWeight: "700", color: Colors.light.income }}>
                +{formatCents(summary.totalIncome, currency)}
              </Text>
            </View>
            <View style={{ width: 1, backgroundColor: "#E5E7EB", marginVertical: 4 }} />
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ fontSize: 11, color: "#6B7280", fontWeight: "500" }}>EXPENSES</Text>
              <Text style={{ fontSize: 15, fontWeight: "700", color: Colors.light.expense }}>
                -{formatCents(summary.totalExpense, currency)}
              </Text>
            </View>
            <View style={{ width: 1, backgroundColor: "#E5E7EB", marginVertical: 4 }} />
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ fontSize: 11, color: "#6B7280", fontWeight: "500" }}>NET</Text>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "700",
                  color: summary.netAmount >= 0 ? Colors.light.income : Colors.light.expense,
                }}
              >
                {summary.netAmount >= 0 ? "+" : ""}
                {formatCents(summary.netAmount, currency)}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Transaction list */}
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : groups.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No transactions"
          message="No transactions found for this month."
          action={
            <Pressable
              onPress={() => router.push("/transaction/new")}
              style={{
                backgroundColor: "#0a7ea4",
                borderRadius: 10,
                paddingHorizontal: 20,
                paddingVertical: 12,
              }}
            >
              <Text style={{ color: "white", fontWeight: "600" }}>Add Transaction</Text>
            </Pressable>
          }
        />
      ) : (
        <SectionList
          sections={groups.map((g) => ({ title: g.date, data: [g] }))}
          keyExtractor={(item) => item.date}
          renderItem={({ item }) => (
            <TransactionGroup group={item} currency={currency} showAccount />
          )}
          renderSectionHeader={() => null}
          contentContainerStyle={{ paddingBottom: 100 }}
          stickySectionHeadersEnabled={false}
        />
      )}

      {/* FAB */}
      <Pressable
        onPress={() => router.push("/transaction/new")}
        style={{
          position: "absolute",
          bottom: 32,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: Colors.light.tint,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOpacity: 0.3,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 8,
        }}
      >
        <Text style={{ color: "white", fontSize: 28, lineHeight: 30 }}>+</Text>
      </Pressable>
    </View>
  );
}

import { router } from "expo-router";
import { ActivityIndicator, Pressable, SectionList, Text, View } from "react-native";

import { EmptyState } from "@/components/common/empty-state";
import { TransactionGroup } from "@/components/transaction/transaction-group";
import { useMonthSummary, useTransactions } from "@/hooks/use-transactions";
import { useUIStore } from "@/stores/ui-store";
import { formatCents } from "@/utils/currency";
import { addMonths, formatMonth } from "@/utils/date";
import type { DayGroup, TransactionWithDetails } from "@/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Sub-components ──────────────────────────────────────────────────────────

interface MonthNavigatorProps {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
}

function MonthNavigator({ year, month, onPrev, onNext }: MonthNavigatorProps) {
  return (
    <View className="flex-row items-center px-5 py-2">
      <Pressable onPress={onPrev} hitSlop={12} className="p-1">
        <Text className="text-[22px] text-gray-500">‹</Text>
      </Pressable>
      <Text className="flex-1 text-center text-[17px] font-bold text-gray-900">
        {formatMonth(year, month)}
      </Text>
      <Pressable onPress={onNext} hitSlop={12} className="p-1">
        <Text className="text-[22px] text-gray-500">›</Text>
      </Pressable>
    </View>
  );
}

interface MonthlySummaryProps {
  income: number;
  expense: number;
  net: number;
  currency: string;
}

function MonthlySummary({ income, expense, net, currency }: MonthlySummaryProps) {
  const netClass = net >= 0 ? "text-green-600" : "text-red-600";
  return (
    <View className="flex-row border-t border-gray-100">
      <View className="flex-1 items-center py-2">
        <Text className="text-[11px] text-gray-500 font-medium mb-0.5">INCOME 📈</Text>
        <Text
          className="text-[15px] font-bold text-green-600"
          style={{ fontVariant: ["tabular-nums"] }}
        >
          +{formatCents(income, currency)}
        </Text>
      </View>
      <View className="w-px bg-gray-200 my-1" />
      <View className="flex-1 items-center py-2">
        <Text className="text-[11px] text-gray-500 font-medium mb-0.5">EXPENSES 💸</Text>
        <Text
          className="text-[15px] font-bold text-red-600"
          style={{ fontVariant: ["tabular-nums"] }}
        >
          -{formatCents(expense, currency)}
        </Text>
      </View>
      <View className="w-px bg-gray-200 my-1" />
      <View className="flex-1 items-center py-2">
        <Text className="text-[11px] text-gray-500 font-medium mb-0.5">NET</Text>
        <Text
          className={`text-[15px] font-bold ${netClass}`}
          style={{ fontVariant: ["tabular-nums"] }}
        >
          {net >= 0 ? "+" : ""}
          {formatCents(net, currency)}
        </Text>
      </View>
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function TransactionsScreen() {
  const { selectedYear, selectedMonth, setSelectedMonth } = useUIStore();
  const { data: transactions = [], isLoading } = useTransactions({
    year: selectedYear,
    month: selectedMonth,
  });
  const { data: summary } = useMonthSummary(selectedYear, selectedMonth);

  const groups = groupByDay(transactions);
  const currency = transactions[0]?.currency ?? "USD";

  return (
    <View className="flex-1 bg-gray-50">
      {/* Sticky header */}
      <View className="bg-white pt-safe border-b border-gray-100">
        <MonthNavigator
          year={selectedYear}
          month={selectedMonth}
          onPrev={() => {
            const prev = addMonths(selectedYear, selectedMonth, -1);
            setSelectedMonth(prev.year, prev.month);
          }}
          onNext={() => {
            const next = addMonths(selectedYear, selectedMonth, 1);
            setSelectedMonth(next.year, next.month);
          }}
        />
        {summary && (
          <MonthlySummary
            income={summary.totalIncome}
            expense={summary.totalExpense}
            net={summary.netAmount}
            currency={currency}
          />
        )}
      </View>

      {/* List */}
      {isLoading ? (
        <ActivityIndicator className="mt-10" />
      ) : groups.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No transactions"
          message="No transactions found for this month."
          action={
            <Pressable
              onPress={() => router.push("/transaction/new")}
              className="bg-[#0a7ea4] rounded-xl px-5 py-3 mt-1"
            >
              <Text className="text-white font-semibold">＋ Add Transaction</Text>
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
          contentContainerStyle={{ paddingBottom: 112 }}
          stickySectionHeadersEnabled={false}
        />
      )}

      {/* FAB */}
      <Pressable
        onPress={() => router.push("/transaction/new")}
        style={{ boxShadow: "0 4px 16px rgba(10, 126, 164, 0.4)" }}
        className="absolute bottom-8 right-5 w-14 h-14 rounded-full bg-[#0a7ea4] items-center justify-center"
      >
        <Text className="text-white text-[28px] leading-[30px]">＋</Text>
      </Pressable>
    </View>
  );
}

import { router } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, Pressable, SectionList, ScrollView, View } from "react-native";
import { Text } from "@/components/ui/text";
import { SymbolView } from "expo-symbols";
import { Chip } from "heroui-native/chip";
import { CloseButton } from "heroui-native/close-button";

import { EmptyState } from "@/components/common/empty-state";
import { TransactionGroup } from "@/components/transaction/transaction-group";
import { useAccountsWithBalances } from "@/hooks/use-accounts";
import { useCategories } from "@/hooks/use-categories";
import { useRecurringProcessor } from "@/hooks/use-recurring-processor";
import { useMonthSummary, useTransactions } from "@/hooks/use-transactions";
import { useUIStore } from "@/stores/ui-store";
import { formatCents } from "@/utils/currency";
import { formatMonth } from "@/utils/date";
import type { DayGroup, TransactionWithDetails } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Active chip ──────────────────────────────────────────────────────────────

interface ActiveChipProps {
  label: string;
  onRemove: () => void;
}

function ActiveChip({ label, onRemove }: ActiveChipProps) {
  return (
    <View
      className="flex-row items-center gap-1 bg-gray-900 rounded-full pl-3 pr-2 py-1.5"
      style={{ borderCurve: "continuous" }}
    >
      <Text className="text-[12px] font-medium text-white">{label}</Text>
      <Pressable
        onPress={onRemove}
        hitSlop={8}
        className="w-4 h-4 items-center justify-center active:opacity-60"
      >
        <SymbolView name="xmark" size={10} tintColor="rgba(255,255,255,0.7)" weight="bold" />
      </Pressable>
    </View>
  );
}

// ─── Sticky header ────────────────────────────────────────────────────────────

interface StickyHeaderProps {
  activeFilterCount: number;
  activeAccountName: string | null;
  selectedYear: number | null;
  selectedMonth: number | null;
  selectedCategoryName: string | null;
  summary: { totalIncome: number; totalExpense: number; netAmount: number } | undefined;
  currency: string;
  setActiveAccountId: (id: string | null) => void;
  setSelectedMonth: (year: number | null, month: number | null) => void;
  setSelectedCategoryId: (id: string | null) => void;
}

function StickyHeader({
  activeFilterCount,
  activeAccountName,
  selectedYear,
  selectedMonth,
  selectedCategoryName,
  summary,
  currency,
  setActiveAccountId,
  setSelectedMonth,
  setSelectedCategoryId,
}: StickyHeaderProps) {
  const hasChips = !!(activeAccountName || selectedMonth || selectedCategoryName);

  return (
    <View className="bg-white border-b border-gray-100">
      {/* Title row */}
      <View className="flex-row items-center justify-between px-4 pt-safe-offset-3 pb-3">
        <Text className="text-[20px] font-bold text-gray-900">💰 Finances</Text>
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={() => router.push("/(tabs)/filters")}
            className="w-8 h-8 items-center justify-center rounded-full bg-gray-100 active:bg-gray-200"
            style={{ borderCurve: "continuous" }}
          >
            <SymbolView
              name="line.3.horizontal.decrease.circle"
              size={20}
              tintColor={activeFilterCount > 0 ? "#111827" : "#6b7280"}
              weight={activeFilterCount > 0 ? "semibold" : "regular"}
            />
            {activeFilterCount > 0 && (
              <View className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-gray-900 items-center justify-center">
                <Text className="text-[9px] font-bold text-white">{activeFilterCount}</Text>
              </View>
            )}
          </Pressable>
          <Pressable
            onPress={() => router.push("/(tabs)/settings")}
            className="w-8 h-8 items-center justify-center rounded-full bg-gray-100 active:bg-gray-200"
            style={{ borderCurve: "continuous" }}
          >
            <Text className="text-[15px]">⚙️</Text>
          </Pressable>
        </View>
      </View>

      {/* Active filter chips */}
      {hasChips && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 10 }}
        >
          {activeAccountName && (
            <Chip color="default">
              <Text>💳</Text>
              <Chip.Label>{activeAccountName}</Chip.Label>
              <CloseButton onPress={() => setActiveAccountId(null)} />
            </Chip>
          )}
          {selectedYear && selectedMonth && (
            <Chip color="default">
              <Text>📅</Text>
              <Chip.Label>{formatMonth(selectedYear, selectedMonth)}</Chip.Label>
              <CloseButton onPress={() => setSelectedMonth(null, null)} />
            </Chip>
          )}
          {selectedCategoryName && (
            <Chip color="default">
              <Text>🏷️</Text>
              <Chip.Label>{selectedCategoryName}</Chip.Label>
              <CloseButton onPress={() => setSelectedCategoryId(null)} />
            </Chip>
          )}
        </ScrollView>
      )}

      {/* Monthly summary — only when a specific month is selected */}
      {summary && selectedMonth && (
        <View className="flex-row items-center gap-5 px-4 pb-3">
          <View className="items-start">
            <Text className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Income</Text>
            <Text
              className="text-[13px] font-semibold text-green-600"
              style={{ fontVariant: ["tabular-nums"] }}
            >
              📈 +{formatCents(summary.totalIncome, currency)}
            </Text>
          </View>
          <View className="w-px h-6 bg-gray-200" />
          <View className="items-start">
            <Text className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Spent</Text>
            <Text
              className="text-[13px] font-semibold text-red-500"
              style={{ fontVariant: ["tabular-nums"] }}
            >
              💸 -{formatCents(summary.totalExpense, currency)}
            </Text>
          </View>
          <View className="w-px h-6 bg-gray-200" />
          <View className="items-start">
            <Text className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Net</Text>
            <Text
              className={`text-[13px] font-semibold ${summary.netAmount >= 0 ? "text-green-600" : "text-red-500"}`}
              style={{ fontVariant: ["tabular-nums"] }}
            >
              📊 {summary.netAmount >= 0 ? "+" : ""}
              {formatCents(summary.netAmount, currency)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  useRecurringProcessor();

  const {
    selectedYear,
    selectedMonth,
    setSelectedMonth,
    activeAccountId,
    setActiveAccountId,
    selectedCategoryId,
    setSelectedCategoryId,
    resetFilters,
  } = useUIStore();

  const { data: accounts = [], isLoading: loadingAccounts } = useAccountsWithBalances();
  const { data: allCategories = [] } = useCategories();
  const { data: allTransactions = [], isLoading: loadingTx } = useTransactions({
    year: selectedYear ?? undefined,
    month: selectedMonth ?? undefined,
    accountId: activeAccountId,
  });
  const { data: summary } = useMonthSummary(
    selectedYear ?? 0,
    selectedMonth ?? 0,
    activeAccountId,
    !!(selectedYear && selectedMonth),
  );

  // Client-side category filter
  const transactions = useMemo(() => {
    if (!selectedCategoryId) return allTransactions;
    return allTransactions.filter((t) => t.category?.id === selectedCategoryId);
  }, [allTransactions, selectedCategoryId]);

  if (!loadingAccounts && accounts.length === 0) {
    router.replace("/onboarding");
    return null;
  }

  const activeAccount = accounts.find((a) => a.id === activeAccountId);
  const activeCategory = allCategories.find((c) => c.id === selectedCategoryId);
  const activeFilterCount = [activeAccountId, selectedMonth, selectedCategoryId].filter(
    Boolean,
  ).length;

  const groups = groupByDay(transactions);
  const currency =
    activeAccount?.currency ?? transactions[0]?.currency ?? accounts[0]?.currency ?? "USD";

  return (
    <View className="flex-1 bg-white">
      <StickyHeader
        activeFilterCount={activeFilterCount}
        activeAccountName={activeAccount?.name ?? null}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        selectedCategoryName={activeCategory?.name ?? null}
        summary={selectedMonth ? summary : undefined}
        currency={currency}
        setActiveAccountId={setActiveAccountId}
        setSelectedMonth={setSelectedMonth}
        setSelectedCategoryId={setSelectedCategoryId}
      />

      {loadingTx ? (
        <ActivityIndicator className="mt-10" />
      ) : groups.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No transactions"
          message={
            activeFilterCount > 0
              ? "No transactions match the current filters."
              : "No transactions yet. Tap ＋ to get started."
          }
          action={
            activeFilterCount > 0 ? (
              <Pressable
                onPress={resetFilters}
                className="mt-1 px-5 py-2.5 rounded-full bg-gray-900 active:opacity-80"
                style={{ borderCurve: "continuous" }}
              >
                <Text className="text-white text-[14px] font-medium">Reset Filters</Text>
              </Pressable>
            ) : undefined
          }
        />
      ) : (
        <SectionList
          sections={groups.map((g) => ({ title: g.date, data: [g] }))}
          keyExtractor={(item) => item.date}
          renderItem={({ item }) => (
            <TransactionGroup
              group={item}
              currency={currency}
              showAccount={activeAccountId === null}
            />
          )}
          renderSectionHeader={() => null}
          contentContainerStyle={{ paddingBottom: 112 }}
          stickySectionHeadersEnabled={false}
        />
      )}

      {/* FAB */}
      <Pressable
        onPress={() => router.push("/transaction/new")}
        style={{ boxShadow: "0 4px 20px rgba(0, 0, 0, 0.18)", borderCurve: "continuous" }}
        className="absolute bottom-safe-offset-8 right-5 w-14 h-14 rounded-full bg-gray-900 items-center justify-center active:opacity-80"
      >
        <Text className="text-white text-[28px]">＋</Text>
      </Pressable>
    </View>
  );
}

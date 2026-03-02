import { router } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, SectionList, ScrollView, View } from "react-native";
import { Text } from "@/components/ui/text";
import * as DropdownMenu from "zeego/dropdown-menu";

import { EmptyState } from "@/components/common/empty-state";
import { TransactionGroup } from "@/components/transaction/transaction-group";
import { useAccountsWithBalances } from "@/hooks/use-accounts";
import { useCategories } from "@/hooks/use-categories";
import { useRecurringProcessor } from "@/hooks/use-recurring-processor";
import { useMonthSummary, useTransactions } from "@/hooks/use-transactions";
import { useUIStore } from "@/stores/ui-store";
import { formatCents } from "@/utils/currency";
import { formatMonth } from "@/utils/date";
import type { AccountWithBalance, Category, DayGroup, TransactionWithDetails } from "@/types";

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

/** Generate the last N months as { year, month } entries, newest first */
function recentMonths(count = 24): { year: number; month: number }[] {
  const now = new Date();
  const result: { year: number; month: number }[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
  }
  return result;
}

const MONTHS = recentMonths(24);

const ACCOUNT_EMOJI: Record<string, string> = {
  checking: "💳",
  savings: "🏦",
  cash: "💵",
  credit_card: "💳",
  investment: "📈",
  other: "🏧",
};

// ─── Sub-components ──────────────────────────────────────────────────────────

interface FilterPillProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
  accentColor?: string;
  rightLabel?: string;
}

function FilterPill({ label, isSelected, onPress, accentColor, rightLabel }: FilterPillProps) {
  const bg = isSelected ? (accentColor ?? "#111827") : "#f3f4f6";
  return (
    <Pressable
      onPress={onPress}
      style={{ backgroundColor: bg, borderCurve: "continuous" }}
      className="rounded-full px-3 py-1.5 flex-row items-center gap-1.5 active:opacity-70"
    >
      {accentColor && !isSelected && (
        <View style={{ backgroundColor: accentColor }} className="w-2 h-2 rounded-full" />
      )}
      <Text
        className={`text-[13px] font-medium ${isSelected ? "text-white" : "text-gray-700"}`}
        style={{ fontVariant: ["tabular-nums"] }}
      >
        {label}
      </Text>
      {rightLabel ? (
        <Text
          className={`text-[11px] ${isSelected ? "text-white/75" : "text-gray-500"}`}
          style={{ fontVariant: ["tabular-nums"] }}
        >
          {rightLabel}
        </Text>
      ) : null}
    </Pressable>
  );
}

interface MonthDropdownProps {
  selectedYear: number | null;
  selectedMonth: number | null;
  onSelect: (year: number | null, month: number | null) => void;
}

function MonthDropdown({ selectedYear, selectedMonth, onSelect }: MonthDropdownProps) {
  const label =
    selectedYear && selectedMonth
      ? `📅 ${formatMonth(selectedYear, selectedMonth)}`
      : "📅 All Time";

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <Pressable
          style={{
            backgroundColor: selectedMonth ? "#111827" : "#f3f4f6",
            borderCurve: "continuous",
          }}
          className="rounded-full px-3 py-1.5 flex-row items-center gap-1 active:opacity-70"
        >
          <Text
            className={`text-[13px] font-medium ${selectedMonth ? "text-white" : "text-gray-700"}`}
          >
            {label}
          </Text>
          <Text className={`text-[10px] ${selectedMonth ? "text-white/60" : "text-gray-400"}`}>
            ▾
          </Text>
        </Pressable>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content>
        <DropdownMenu.Item key="all-time" onSelect={() => onSelect(null, null)}>
          <DropdownMenu.ItemTitle>📅 All Time</DropdownMenu.ItemTitle>
        </DropdownMenu.Item>

        {MONTHS.map(({ year, month }) => {
          const key = `${year}-${String(month).padStart(2, "0")}`;
          const isActive = year === selectedYear && month === selectedMonth;
          return (
            <DropdownMenu.Item key={key} onSelect={() => onSelect(year, month)}>
              <DropdownMenu.ItemTitle>
                {isActive ? "✓ " : ""}
                {formatMonth(year, month)}
              </DropdownMenu.ItemTitle>
            </DropdownMenu.Item>
          );
        })}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}

interface StickyHeaderProps {
  accounts: AccountWithBalance[];
  activeAccountId: string | null;
  onSelectAccount: (id: string | null) => void;
  selectedYear: number | null;
  selectedMonth: number | null;
  onSelectMonth: (year: number | null, month: number | null) => void;
  summary: { totalIncome: number; totalExpense: number; netAmount: number } | undefined;
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  currency: string;
}

function StickyHeader({
  accounts,
  activeAccountId,
  onSelectAccount,
  selectedYear,
  selectedMonth,
  onSelectMonth,
  summary,
  categories,
  selectedCategoryId,
  onSelectCategory,
  currency,
}: StickyHeaderProps) {
  return (
    <View className="bg-white border-b border-gray-100">
      {/* Top bar */}
      <View className="flex-row items-center justify-between px-4 pt-safe-offset-3 pb-3">
        <Text className="text-[20px] font-bold text-gray-900">💰 Finances</Text>
        <Pressable
          onPress={() => router.push("/(tabs)/settings")}
          className="w-8 h-8 items-center justify-center rounded-full bg-gray-100 active:bg-gray-200"
          style={{ borderCurve: "continuous" }}
        >
          <Text className="text-[15px]">⚙️</Text>
        </Pressable>
      </View>

      {/* Account switcher */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 10 }}
      >
        <FilterPill
          label="🌐 All"
          isSelected={activeAccountId === null}
          onPress={() => onSelectAccount(null)}
        />
        {accounts.map((account) => (
          <FilterPill
            key={account.id}
            label={`${ACCOUNT_EMOJI[account.type] ?? "🏧"} ${account.name}`}
            isSelected={activeAccountId === account.id}
            accentColor={account.color}
            rightLabel={formatCents(account.balance, account.currency)}
            onPress={() => onSelectAccount(activeAccountId === account.id ? null : account.id)}
          />
        ))}
      </ScrollView>

      {/* Month dropdown + summary */}
      <View className="px-4 pb-3">
        <MonthDropdown
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          onSelect={onSelectMonth}
        />

        {/* Summary — only shown when a specific month is selected */}
        {summary && selectedMonth && (
          <View className="flex-row items-center gap-5 mt-3">
            <View className="items-start">
              <Text className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">
                Income
              </Text>
              <Text
                className="text-[13px] font-semibold text-green-600"
                style={{ fontVariant: ["tabular-nums"] }}
              >
                📈 +{formatCents(summary.totalIncome, currency)}
              </Text>
            </View>
            <View className="w-px h-6 bg-gray-200" />
            <View className="items-start">
              <Text className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">
                Spent
              </Text>
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

      {/* Category filter */}
      {categories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 10 }}
        >
          <FilterPill
            label="🏷️ All"
            isSelected={selectedCategoryId === null}
            onPress={() => onSelectCategory(null)}
          />
          {categories.map((cat) => (
            <FilterPill
              key={cat.id}
              label={cat.name}
              accentColor={cat.color}
              isSelected={selectedCategoryId === cat.id}
              onPress={() => onSelectCategory(selectedCategoryId === cat.id ? null : cat.id)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  useRecurringProcessor();

  const { selectedYear, selectedMonth, setSelectedMonth, activeAccountId, setActiveAccountId } =
    useUIStore();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

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

  // Only show categories present in this period
  const activeCategories = useMemo(() => {
    const ids = new Set(allTransactions.map((t) => t.category?.id).filter(Boolean));
    return allCategories.filter((c) => ids.has(c.id));
  }, [allTransactions, allCategories]);

  if (!loadingAccounts && accounts.length === 0) {
    router.replace("/onboarding");
    return null;
  }

  const groups = groupByDay(transactions);
  const currency =
    accounts.find((a) => a.id === activeAccountId)?.currency ??
    transactions[0]?.currency ??
    accounts[0]?.currency ??
    "USD";

  return (
    <View className="flex-1 bg-gray-50">
      <StickyHeader
        accounts={accounts}
        activeAccountId={activeAccountId}
        onSelectAccount={(id) => {
          setActiveAccountId(id);
          setSelectedCategoryId(null);
        }}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        onSelectMonth={(year, month) => {
          setSelectedMonth(year, month);
          setSelectedCategoryId(null);
        }}
        summary={selectedMonth ? summary : undefined}
        categories={activeCategories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={setSelectedCategoryId}
        currency={currency}
      />

      {loadingTx ? (
        <ActivityIndicator className="mt-10" />
      ) : groups.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No transactions"
          message={
            selectedCategoryId
              ? "No transactions for this category."
              : selectedMonth
                ? "No transactions found for this period."
                : "No transactions yet. Tap ＋ to get started."
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

      {/* FAB — the one and only add button */}
      <Pressable
        onPress={() => router.push("/transaction/new")}
        style={{ boxShadow: "0 4px 20px rgba(0, 0, 0, 0.18)", borderCurve: "continuous" }}
        className="absolute bottom-safe-offset-8 right-5 w-14 h-14 rounded-full bg-gray-900 items-center justify-center active:opacity-80"
      >
        <Text className="text-white text-[28px] leading-7.5">＋</Text>
      </Pressable>
    </View>
  );
}

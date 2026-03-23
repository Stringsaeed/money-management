import { intlFormat } from "date-fns";
import { router } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, Pressable, SectionList, ScrollView, View } from "react-native";
import { Text } from "@/components/ui/text";
import { SymbolView } from "expo-symbols";

import { EmptyState } from "@/components/common/empty-state";
import { TransactionGroup } from "@/components/transaction/transaction-group";
import { useAccountsWithBalances } from "@/hooks/use-accounts";
import { useCategories } from "@/hooks/use-categories";
import { useRecurringProcessor } from "@/hooks/use-recurring-processor";
import { useMonthSummary, useTransactions } from "@/hooks/use-transactions";
import { useUIStore } from "@/stores/ui-store";
import { formatCents } from "@/utils/currency";
import { formatMonth } from "@/utils/date";
import type { AccountWithBalance, DayGroup, TransactionWithDetails } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { XIcon } from "phosphor-react-native";
import { Icon } from "@/components/ui/icon";

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

function formatHeaderDate(): string {
  return intlFormat(new Date(), {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).toUpperCase();
}

function computeTotalBalance(accounts: AccountWithBalance[]): {
  totalCents: number;
  currency: string;
} {
  const currency = accounts[0]?.currency ?? "USD";
  const totalCents = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  return { totalCents, currency };
}

// ─── Balance Hero ─────────────────────────────────────────────────────────────

function BalanceHero({
  accounts,
  activeFilterCount,
}: {
  accounts: AccountWithBalance[];
  activeFilterCount: number;
}) {
  const { totalCents, currency } = computeTotalBalance(accounts);

  return (
    <View className="px-5 pt-safe-offset-4 pb-2 bg-background">
      {/* Top row: date label + action buttons */}
      <View className="flex-row items-center justify-between mb-2">
        <Text className="font-body-semibold text-[11px] text-ink/40 uppercase tracking-wider">
          AS OF {formatHeaderDate()}
        </Text>
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={() => router.push("/(tabs)/filters")}
            className="w-8 h-8 items-center justify-center rounded-full bg-surface-container active:bg-surface-dim"
            style={{ borderCurve: "continuous" }}
          >
            <SymbolView
              name="line.3.horizontal.decrease.circle"
              size={20}
              tintColor={activeFilterCount > 0 ? "#1C1B1A" : "#9CA3AF"}
              weight={activeFilterCount > 0 ? "semibold" : "regular"}
            />
            {activeFilterCount > 0 && (
              <View className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-ink items-center justify-center">
                <Text className="text-[9px] font-bold text-background">{activeFilterCount}</Text>
              </View>
            )}
          </Pressable>
          <Pressable
            onPress={() => router.push("/(tabs)/settings")}
            className="w-8 h-8 items-center justify-center rounded-full bg-surface-container active:bg-surface-dim"
            style={{ borderCurve: "continuous" }}
          >
            <SymbolView name="gearshape" size={18} tintColor="#9CA3AF" />
          </Pressable>
        </View>
      </View>

      {/* Balance amount */}
      <Text
        className="font-heading-medium text-[48px] leading-tight text-ink"
        style={{ fontVariant: ["tabular-nums"] }}
        selectable
      >
        {formatCents(totalCents, currency)}
      </Text>

      {/* Action buttons */}
      <View className="flex-row gap-3 mt-4 mb-2">
        <Pressable
          onPress={() => router.push("/transaction/new")}
          className="flex-row items-center gap-2 px-5 py-2.5 border border-ink active:bg-ink"
          style={{ borderCurve: "continuous" }}
        >
          <SymbolView name="plus" size={14} tintColor="#1C1B1A" />
          <Text className="font-body-semibold text-[11px] text-ink uppercase tracking-wide">
            Add Entry
          </Text>
        </Pressable>
        <Pressable
          onPress={() => router.push("/transaction/new")}
          className="flex-row items-center gap-2 px-5 py-2.5 bg-surface-container active:bg-surface-dim"
          style={{ borderCurve: "continuous" }}
        >
          <Text className="font-body-semibold text-[11px] text-ink uppercase tracking-wide">
            Transfer
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Accounts Section ─────────────────────────────────────────────────────────

function AccountsSection({ accounts }: { accounts: AccountWithBalance[] }) {
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
          <SymbolView name="arrow.right" size={10} tintColor="#9CA3AF" />
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
              <Text className="text-lg">
                {account.type === "cash"
                  ? "💵"
                  : account.type === "bank"
                    ? "🏦"
                    : account.type === "credit"
                      ? "💳"
                      : account.type === "investment"
                        ? "📈"
                        : "💰"}
              </Text>
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

// ─── Filter Bar ───────────────────────────────────────────────────────────────

interface FilterBarProps {
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

function FilterBar({
  activeAccountName,
  selectedYear,
  selectedMonth,
  selectedCategoryName,
  summary,
  currency,
  setActiveAccountId,
  setSelectedMonth,
  setSelectedCategoryId,
}: FilterBarProps) {
  const hasChips = !!(activeAccountName || selectedMonth || selectedCategoryName);
  if (!hasChips) return null;

  return (
    <View className="bg-background">
      {/* Active filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 10 }}
      >
        {activeAccountName && (
          <Badge>
            <Text className="font-body-medium text-xs">{activeAccountName}</Text>
            <Button onPress={() => setActiveAccountId(null)} variant="outline" size="icon">
              <Icon as={XIcon} />
            </Button>
          </Badge>
        )}
        {selectedYear && selectedMonth && (
          <Badge>
            <Text className="font-body-medium text-xs">
              {formatMonth(selectedYear, selectedMonth)}
            </Text>
            <Button onPress={() => setSelectedMonth(null, null)} variant="outline" size="icon">
              <Icon as={XIcon} />
            </Button>
          </Badge>
        )}
        {selectedCategoryName && (
          <Badge>
            <Text className="font-body-medium text-xs">{selectedCategoryName}</Text>
            <Button onPress={() => setSelectedCategoryId(null)} variant="outline" size="icon">
              <Icon as={XIcon} />
            </Button>
          </Badge>
        )}
      </ScrollView>

      {/* Monthly summary */}
      {summary && selectedMonth && (
        <View className="flex-row items-center gap-5 px-5 pb-3">
          <View className="items-start">
            <Text className="font-body-semibold text-[10px] text-ink/40 uppercase tracking-wide mb-0.5">
              Income
            </Text>
            <Text
              className="font-heading-normal text-sm text-sage"
              style={{ fontVariant: ["tabular-nums"] }}
            >
              +{formatCents(summary.totalIncome, currency)}
            </Text>
          </View>
          <View className="w-px h-6 bg-ledger-outline" />
          <View className="items-start">
            <Text className="font-body-semibold text-[10px] text-ink/40 uppercase tracking-wide mb-0.5">
              Spent
            </Text>
            <Text
              className="font-heading-normal text-sm text-terracotta"
              style={{ fontVariant: ["tabular-nums"] }}
            >
              -{formatCents(summary.totalExpense, currency)}
            </Text>
          </View>
          <View className="w-px h-6 bg-ledger-outline" />
          <View className="items-start">
            <Text className="font-body-semibold text-[10px] text-ink/40 uppercase tracking-wide mb-0.5">
              Net
            </Text>
            <Text
              className={`font-heading-normal text-sm ${summary.netAmount >= 0 ? "text-sage" : "text-terracotta"}`}
              style={{ fontVariant: ["tabular-nums"] }}
            >
              {summary.netAmount >= 0 ? "+" : ""}
              {formatCents(summary.netAmount, currency)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Journal Header ───────────────────────────────────────────────────────────

function JournalHeader() {
  return (
    <View className="flex-row items-center justify-between px-5 pb-2 pt-4 border-b border-ledger-outline mx-5">
      <Text className="font-heading-normal text-xl italic text-ink">Recent Journal</Text>
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

  const ListHeader = (
    <>
      <BalanceHero accounts={accounts} activeFilterCount={activeFilterCount} />
      <AccountsSection accounts={accounts} />
      <FilterBar
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
      <JournalHeader />
    </>
  );

  return (
    <View className="flex-1 bg-background">
      {loadingTx ? (
        <>
          {ListHeader}
          <ActivityIndicator className="mt-10" />
        </>
      ) : groups.length === 0 ? (
        <>
          {ListHeader}
          <EmptyState
            icon="📋"
            title="No transactions"
            message={
              activeFilterCount > 0
                ? "No transactions match the current filters."
                : "No transactions yet. Tap + Add Entry to get started."
            }
            action={
              activeFilterCount > 0 ? (
                <Pressable
                  onPress={resetFilters}
                  className="mt-1 px-5 py-2.5 border border-ink active:bg-ink"
                  style={{ borderCurve: "continuous" }}
                >
                  <Text className="font-body-semibold text-[11px] text-ink uppercase tracking-wide">
                    Reset Filters
                  </Text>
                </Pressable>
              ) : undefined
            }
          />
        </>
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
          ListHeaderComponent={ListHeader}
          contentContainerStyle={{ paddingBottom: 112 }}
          stickySectionHeadersEnabled={false}
        />
      )}
    </View>
  );
}

import { Redirect, Stack, useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import type {
  NativeStackHeaderItem,
  NativeStackHeaderItemMenuAction,
  NativeStackHeaderItemMenuSubmenu,
} from "@react-navigation/native-stack";

import { EmptyState } from "@/components/common/empty-state";
import { BalanceHero } from "@/components/home/balance-hero";
import { FilterBar } from "@/components/home/filter-bar";
import { JournalHeader } from "@/components/home/journal-header";
import { StatsCharts } from "@/components/settings/stats-charts";
import { TransactionRow } from "@/components/transaction/transaction-row";
import { Text } from "@/components/ui/text";
import { useCategorySpending, useMonthlyTrend } from "@/hooks/use-chart-data";
import { useHomeScreen } from "@/hooks/use-home-screen";
import { formatMonth, monthsBetween, formatDayHeader } from "@/utils/date";
import { formatCents } from "@/utils/currency";
import {
  buildJournalList,
  type JournalListItem,
  type SectionHeaderItem,
} from "@/utils/journal-list";

// ── List item components ─────────────────────────────────────────────────────

function DayHeader({ item }: { item: SectionHeaderItem }) {
  const net = item.totalIncome - item.totalExpense;
  return (
    <View className="flex-row justify-between items-center px-5 py-2.5 bg-surface-container/50">
      <Text className="font-body-semibold text-[11px] text-ink/50 uppercase tracking-tight">
        {formatDayHeader(item.date)}
      </Text>
      {(item.totalIncome > 0 || item.totalExpense > 0) && (
        <Text
          className={`font-heading-normal text-[13px] ${net >= 0 ? "text-sage" : "text-terracotta"}`}
          style={{ fontVariant: ["tabular-nums"] }}
        >
          {net >= 0 ? "+" : ""}
          {formatCents(net, item.currency)}
        </Text>
      )}
    </View>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const {
    accounts,
    allCategories,
    dateRange,
    loadingAccounts,
    loadingTx,
    groups,
    currency,
    activeFilterCount,
    activeAccount,
    activeCategory,
    summary,
    selectedYear,
    selectedMonth,
    activeAccountId,
    selectedCategoryId,
    setSelectedMonth,
    setActiveAccountId,
    setSelectedCategoryId,
    resetFilters,
  } = useHomeScreen();

  const availableMonths = useMemo(
    () => monthsBetween(dateRange?.minDate, dateRange?.maxDate),
    [dateRange?.minDate, dateRange?.maxDate],
  );

  const flatTransactions = useMemo(() => groups.flatMap((g) => g.transactions), [groups]);
  const categorySpending = useCategorySpending(flatTransactions);
  const monthlyTrend = useMonthlyTrend(flatTransactions);

  const filteredBalance = useMemo(() => {
    if (activeFilterCount === 0) {
      return accounts.reduce((sum, acc) => sum + acc.balance, 0);
    }
    let net = 0;
    for (const g of groups) {
      for (const t of g.transactions) {
        if (t.type === "income") net += t.amount;
        else if (t.type === "expense") net -= t.amount;
      }
    }
    return net;
  }, [activeFilterCount, accounts, groups]);

  const showAccount = activeAccountId === null;
  const items = useMemo(
    () => buildJournalList(groups, currency, showAccount),
    [groups, currency, showAccount],
  );

  const renderItem = useCallback(({ item }: { item: JournalListItem }) => {
    if (item.type === "section-header") {
      return <DayHeader item={item} />;
    }
    return (
      <View>
        <TransactionRow transaction={item.data} showAccount={item.showAccount} />
        {!item.isLast && <View className="h-px bg-ledger-outline ml-16" />}
      </View>
    );
  }, []);

  const getItemType = useCallback((item: JournalListItem) => item.type, []);

  const keyExtractor = useCallback(
    (item: JournalListItem) =>
      item.type === "section-header" ? `header-${item.date}` : `tx-${item.data.id}`,
    [],
  );

  if (!loadingAccounts && accounts.length === 0) {
    return <Redirect href="/onboarding" />;
  }

  // ── Filter menu ────────────────────────────────────────────────────────────

  const accountSubmenu: NativeStackHeaderItemMenuSubmenu = {
    type: "submenu",
    label: "Account",
    icon: { type: "sfSymbol", name: "building.columns" },
    items: [
      {
        type: "action",
        label: "All Accounts",
        state: activeAccountId === null ? "on" : "off",
        onPress: () => setActiveAccountId(null),
      } satisfies NativeStackHeaderItemMenuAction,
      ...accounts.map(
        (acc) =>
          ({
            type: "action",
            label: acc.name,
            state: activeAccountId === acc.id ? "on" : "off",
            onPress: () => setActiveAccountId(activeAccountId === acc.id ? null : acc.id),
          }) satisfies NativeStackHeaderItemMenuAction,
      ),
    ],
  };

  const periodSubmenu: NativeStackHeaderItemMenuSubmenu = {
    type: "submenu",
    label: "Period",
    icon: { type: "sfSymbol", name: "calendar" },
    items: [
      {
        type: "action",
        label: "All Time",
        state: selectedMonth === null ? "on" : "off",
        onPress: () => setSelectedMonth(null, null),
      } satisfies NativeStackHeaderItemMenuAction,
      ...availableMonths.map(
        ({ year, month }) =>
          ({
            type: "action",
            label: formatMonth(year, month),
            state: year === selectedYear && month === selectedMonth ? "on" : "off",
            onPress: () =>
              year === selectedYear && month === selectedMonth
                ? setSelectedMonth(null, null)
                : setSelectedMonth(year, month),
          }) satisfies NativeStackHeaderItemMenuAction,
      ),
    ],
  };

  const categorySubmenu: NativeStackHeaderItemMenuSubmenu = {
    type: "submenu",
    label: "Category",
    icon: { type: "sfSymbol", name: "tag" },
    items: [
      {
        type: "action",
        label: "All Categories",
        state: selectedCategoryId === null ? "on" : "off",
        onPress: () => setSelectedCategoryId(null),
      } satisfies NativeStackHeaderItemMenuAction,
      ...allCategories.map(
        (cat) =>
          ({
            type: "action",
            label: cat.name,
            state: selectedCategoryId === cat.id ? "on" : "off",
            onPress: () => setSelectedCategoryId(selectedCategoryId === cat.id ? null : cat.id),
          }) satisfies NativeStackHeaderItemMenuAction,
      ),
    ],
  };

  const filterMenuItems: (NativeStackHeaderItemMenuAction | NativeStackHeaderItemMenuSubmenu)[] = [
    accountSubmenu,
    periodSubmenu,
    categorySubmenu,
  ];

  if (activeFilterCount > 0) {
    filterMenuItems.push({
      type: "action",
      label: "Reset All Filters",
      icon: { type: "sfSymbol", name: "xmark.circle" },
      destructive: true,
      onPress: resetFilters,
    });
  }

  const headerLeftItems: NativeStackHeaderItem[] = [
    {
      label: "navigation",
      type: "menu",
      icon: {
        type: "sfSymbol",
        name: "line.3.horizontal",
      },
      menu: {
        items: [
          {
            type: "action",
            label: "Ledger",
            icon: { type: "sfSymbol", name: "book" },
            onPress: () => router.push("/ledger" as never),
          },
          {
            type: "action",
            label: "Envelopes",
            icon: { type: "sfSymbol", name: "envelope" },
            onPress: () => router.push("/envelopes" as never),
          },
          {
            type: "action",
            label: "Obligations — Coming Soon",
            icon: { type: "sfSymbol", name: "scalemass" },
            disabled: true,
            onPress: () => {},
          },
          {
            type: "action",
            label: "Preferences",
            icon: { type: "sfSymbol", name: "gearshape" },
            onPress: () => router.push("/settings"),
          },
        ],
      },
    },
  ];

  const headerRightItems: NativeStackHeaderItem[] = [
    {
      label: "filters",
      type: "menu",
      icon: {
        type: "sfSymbol",
        name: "line.3.horizontal.decrease.circle",
      },
      badge:
        activeFilterCount > 0
          ? {
              value: activeFilterCount,
            }
          : undefined,
      sharesBackground: false,
      menu: {
        items: filterMenuItems,
      },
    },
    {
      label: "add entry",
      type: "button",
      icon: {
        type: "sfSymbol",
        name: "plus",
      },
      onPress: () => router.push("/transaction/new"),
    },
  ];

  // ── List header ────────────────────────────────────────────────────────────

  const ListHeader = (
    <View className="pt-safe-offset-20">
      <FilterBar
        activeAccountName={activeAccount?.name ?? null}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        selectedCategoryName={activeCategory?.name ?? null}
        summary={summary}
        currency={currency}
        setActiveAccountId={setActiveAccountId}
        setSelectedMonth={setSelectedMonth}
        setSelectedCategoryId={setSelectedCategoryId}
      />
      <BalanceHero balanceCents={filteredBalance} currency={currency} />
      <StatsCharts categorySpending={categorySpending} monthlyTrend={monthlyTrend} />
      <JournalHeader />
    </View>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{
          unstable_headerLeftItems: () => headerLeftItems,
          unstable_headerRightItems: () => headerRightItems,
        }}
      />
      {loadingTx ? (
        <>
          {ListHeader}
          <ActivityIndicator className="mt-10" />
        </>
      ) : items.length === 0 ? (
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
        <FlashList
          data={items}
          renderItem={renderItem}
          getItemType={getItemType}
          keyExtractor={keyExtractor}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={{ paddingBottom: 112 }}
        />
      )}
    </View>
  );
}

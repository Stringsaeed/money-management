import { Redirect, Stack, useRouter } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, Pressable, SectionList, View } from "react-native";
import type {
  NativeStackHeaderItem,
  NativeStackHeaderItemMenuAction,
  NativeStackHeaderItemMenuSubmenu,
} from "@react-navigation/native-stack";

import { EmptyState } from "@/components/common/empty-state";
import { AccountsSection } from "@/components/home/accounts-section";
import { BalanceHero } from "@/components/home/balance-hero";
import { FilterBar } from "@/components/home/filter-bar";
import { JournalHeader } from "@/components/home/journal-header";
import { TransactionGroup } from "@/components/transaction/transaction-group";
import { Text } from "@/components/ui/text";
import { useHomeScreen } from "@/hooks/use-home-screen";
import { formatHeaderDate, formatMonth, monthsBetween } from "@/utils/date";

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
      label: "settings",
      type: "button",
      onPress: () => router.push("/settings"),
      icon: {
        type: "sfSymbol",
        name: "gearshape",
      },
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  const ListHeader = (
    <>
      <BalanceHero accounts={accounts} />
      <AccountsSection accounts={accounts} />
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
      <JournalHeader />
    </>
  );

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{
          headerTitle: () => (
            <Text className="font-body-semibold text-[11px] text-ink/40 uppercase tracking-wider">
              AS OF {formatHeaderDate()}
            </Text>
          ),
          unstable_headerRightItems: () => headerRightItems,
        }}
      />
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

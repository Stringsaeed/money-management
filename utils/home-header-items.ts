import { useRouter } from "expo-router";
import type {
  NativeStackHeaderItem,
  NativeStackHeaderItemMenuAction,
  NativeStackHeaderItemMenuSubmenu,
} from "@react-navigation/native-stack";

import { formatMonth, monthsBetween } from "@/utils/date";
import { useUIStore } from "@/stores/ui-store";
import { useTransactionDateRange } from "@/hooks/use-transactions";
import { useCategories } from "@/hooks/use-categories";
import { useAccountsWithBalances } from "@/hooks/use-accounts";

export function useHomeHeaderItems() {
  const router = useRouter();
  const {
    activeAccountId,
    selectedYear,
    selectedMonth,
    selectedCategoryId,
    setActiveAccountId,
    setSelectedMonth,
    setSelectedCategoryId,
  } = useUIStore();
  const { data: allCategories = [] } = useCategories();
  const { data: dateRange } = useTransactionDateRange();
  const { data: accounts = [] } = useAccountsWithBalances();

  const activeFilterCount = [activeAccountId, selectedMonth, selectedCategoryId].filter(
    Boolean,
  ).length;

  const availableMonths = monthsBetween(dateRange?.minDate, dateRange?.maxDate);

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
      },
      ...accounts.map(
        (account) =>
          ({
            type: "action",
            label: account.name,
            state: activeAccountId === account.id ? "on" : "off",
            onPress: () => setActiveAccountId(activeAccountId === account.id ? null : account.id),
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
        (category) =>
          ({
            type: "action",
            label: category.name,
            state: selectedCategoryId === category.id ? "on" : "off",
            onPress: () =>
              setSelectedCategoryId(selectedCategoryId === category.id ? null : category.id),
          }) satisfies NativeStackHeaderItemMenuAction,
      ),
    ],
  };

  const filterMenuItems: (NativeStackHeaderItemMenuAction | NativeStackHeaderItemMenuSubmenu)[] = [
    accountSubmenu,
    periodSubmenu,
    categorySubmenu,
  ];

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

  return { headerLeftItems, headerRightItems };
}

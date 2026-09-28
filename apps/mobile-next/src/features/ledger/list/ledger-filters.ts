import {
  endOfMonth,
  endOfYear,
  format,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
} from "date-fns";

import type { V2Account, V2Category, V2TransactionKind } from "@trove/api/v2/contracts";

import type { TransactionListFilters } from "@/data/ledger-client";

export type DatePreset = "this-month" | "last-month" | "last-90-days" | "this-year";

export interface LedgerDateRange {
  readonly from: string;
  readonly to: string;
  readonly label: string;
  readonly preset?: DatePreset;
}

export interface LedgerFilterState {
  readonly kinds: readonly V2TransactionKind[];
  readonly accountIds: readonly string[];
  readonly categoryIds: readonly string[];
  readonly range: LedgerDateRange | null;
  readonly search: string;
}

export const EMPTY_LEDGER_FILTERS: LedgerFilterState = {
  kinds: [],
  accountIds: [],
  categoryIds: [],
  range: null,
  search: "",
};

export const KIND_LABELS = {
  income: "Income",
  expense: "Expenses",
  transfer: "Transfers",
} satisfies Record<V2TransactionKind, string>;

export const DATE_PRESETS: readonly { readonly preset: DatePreset; readonly label: string }[] = [
  { preset: "this-month", label: "This month" },
  { preset: "last-month", label: "Last month" },
  { preset: "last-90-days", label: "Last 90 days" },
  { preset: "this-year", label: "This year" },
];

const key = (date: Date) => format(date, "yyyy-MM-dd");

export function presetRange(preset: DatePreset, today: Date): LedgerDateRange {
  const label = DATE_PRESETS.find((item) => item.preset === preset)?.label ?? preset;
  switch (preset) {
    case "this-month":
      return { preset, label, from: key(startOfMonth(today)), to: key(endOfMonth(today)) };
    case "last-month": {
      const month = subMonths(today, 1);
      return { preset, label, from: key(startOfMonth(month)), to: key(endOfMonth(month)) };
    }
    case "last-90-days":
      return { preset, label, from: key(subDays(today, 89)), to: key(today) };
    case "this-year":
      return { preset, label, from: key(startOfYear(today)), to: key(endOfYear(today)) };
  }
}

export function monthRange(month: Date): LedgerDateRange {
  return {
    label: format(month, "MMMM yyyy"),
    from: key(startOfMonth(month)),
    to: key(endOfMonth(month)),
  };
}

export function toggleValue<T extends string>(values: readonly T[], value: T): T[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

export function toListFilters(state: LedgerFilterState): TransactionListFilters {
  return {
    kinds: state.kinds,
    accountIds: state.accountIds,
    categoryIds: state.categoryIds,
    from: state.range?.from ?? null,
    to: state.range?.to ?? null,
    search: state.search,
  };
}

export type ActiveFilter =
  | {
      readonly type: "kind";
      readonly key: string;
      readonly label: string;
      readonly value: V2TransactionKind;
    }
  | {
      readonly type: "account";
      readonly key: string;
      readonly label: string;
      readonly value: string;
    }
  | {
      readonly type: "category";
      readonly key: string;
      readonly label: string;
      readonly value: string;
    }
  | { readonly type: "range"; readonly key: string; readonly label: string }
  | { readonly type: "search"; readonly key: string; readonly label: string };

/** Every applied filter as a removable chip, in the order the filter sheet lists them. */
export function activeFilters(
  state: LedgerFilterState,
  accounts: readonly V2Account[],
  categories: readonly V2Category[],
): ActiveFilter[] {
  const accountName = new Map(accounts.map((account) => [account.id, account.name]));
  const categoryName = new Map(categories.map((category) => [category.id, category.name]));
  const search = state.search.trim();
  return [
    ...state.kinds.map((kind) => ({
      type: "kind" as const,
      key: `kind:${kind}`,
      label: KIND_LABELS[kind],
      value: kind,
    })),
    ...(state.range ? [{ type: "range" as const, key: "range", label: state.range.label }] : []),
    ...state.accountIds.map((id) => ({
      type: "account" as const,
      key: `account:${id}`,
      label: accountName.get(id) ?? "Account",
      value: id,
    })),
    ...state.categoryIds.map((id) => ({
      type: "category" as const,
      key: `category:${id}`,
      label: categoryName.get(id) ?? "Category",
      value: id,
    })),
    ...(search ? [{ type: "search" as const, key: "search", label: `“${search}”` }] : []),
  ];
}

export function removeFilter(state: LedgerFilterState, filter: ActiveFilter): LedgerFilterState {
  switch (filter.type) {
    case "kind":
      return { ...state, kinds: state.kinds.filter((kind) => kind !== filter.value) };
    case "account":
      return { ...state, accountIds: state.accountIds.filter((id) => id !== filter.value) };
    case "category":
      return { ...state, categoryIds: state.categoryIds.filter((id) => id !== filter.value) };
    case "range":
      return { ...state, range: null };
    case "search":
      return { ...state, search: "" };
  }
}

/** Drops ids for Accounts/Categories that no longer exist or were archived. */
export function pruneFilters(
  state: LedgerFilterState,
  accounts: readonly V2Account[],
  categories: readonly V2Category[],
): LedgerFilterState {
  const accountIds = state.accountIds.filter((id) =>
    accounts.some((account) => account.id === id && !account.archived),
  );
  const categoryIds = state.categoryIds.filter((id) =>
    categories.some((category) => category.id === id && !category.archived),
  );
  return accountIds.length === state.accountIds.length &&
    categoryIds.length === state.categoryIds.length
    ? state
    : { ...state, accountIds, categoryIds };
}

import {
  type V2BudgetSetupFacts,
  type V2Category,
  type V2EnvelopeGroup,
  type V2RecurringFrequency,
} from "@trove/api/v2/contracts";

import { currencyFractionDigits } from "@/utils/money";

import { SETUP_PRESETS } from "./setup-presets";
import { GROUP_ORDER, type CustomItem } from "./setup-types";

/** One checklist row: a thing the person may budget for. One ticked item becomes one envelope. */
export interface SetupItem {
  /** `cat:<id>` for an existing Category, `new:<lowercase name>` for one created on activation. */
  readonly key: string;
  readonly name: string;
  readonly group: V2EnvelopeGroup;
  readonly categoryId: string | null;
  readonly defaultTicked: boolean;
  /** Typical monthly amount from active Recurring rules. */
  readonly recurringMinor: number | null;
  /** Spend in the last full period. */
  readonly lastPeriodMinor: number | null;
}

const roundToWholeUnit = (minor: number, currency: string): number => {
  const perWhole = 10 ** currencyFractionDigits(currency);
  return Math.round(minor / perWhole) * perWhole;
};

/** A Recurring rule's amount as a monthly figure, in whole currency units. */
export function monthlyEquivalentMinor(
  rule: {
    readonly amountMinor: number;
    readonly frequency: V2RecurringFrequency;
    readonly intervalCount: number;
  },
  currency: string,
): number {
  const interval = Math.max(rule.intervalCount, 1);
  const perMonth = {
    day: (rule.amountMinor * 365) / 12 / interval,
    week: (rule.amountMinor * 52) / 12 / interval,
    month: rule.amountMinor / interval,
    year: rule.amountMinor / 12 / interval,
  } satisfies Record<V2RecurringFrequency, number>;
  return roundToWholeUnit(perMonth[rule.frequency], currency);
}

const nameKey = (name: string): string => `new:${name.trim().toLowerCase()}`;
const categoryKey = (id: string): string => `cat:${id}`;

/** Active expense Categories only: archived and income Categories are never suggested. */
const activeExpenseCategories = (categories: readonly V2Category[]): V2Category[] =>
  categories.filter((category) => !category.archived && category.kind === "expense");

/** Reuses an existing Category with the same name (case-insensitive), else a new one by name. */
export function resolveItemKey(
  name: string,
  categories: readonly V2Category[],
): { readonly key: string; readonly categoryId: string | null } {
  const match = activeExpenseCategories(categories).find(
    (category) => category.name.trim().toLowerCase() === name.trim().toLowerCase(),
  );
  return match
    ? { key: categoryKey(match.id), categoryId: match.id }
    : { key: nameKey(name), categoryId: null };
}

interface Sources {
  readonly currency: string;
  readonly facts: V2BudgetSetupFacts;
  readonly categories: readonly V2Category[];
  readonly custom: readonly CustomItem[];
}

/**
 * Every row of the checklist. Bills come from active expense Recurring rules (ticked), Everyday
 * from the most used expense Categories (ticked), then the UAE presets and the person's own rows
 * (unticked until chosen). A Category or name appears once; Bills wins over Everyday.
 */
export function buildSetupItems({ currency, facts, categories, custom }: Sources): SetupItem[] {
  const active = activeExpenseCategories(categories);
  const lastPeriod = new Map(
    facts.lastPeriodSpend.map((entry) => [entry.categoryId, entry.amountMinor]),
  );
  const items = new Map<string, SetupItem>();

  const add = (
    entry: Omit<SetupItem, "lastPeriodMinor" | "recurringMinor"> & { recurringMinor?: number },
  ) => {
    const existing = items.get(entry.key);
    if (existing) {
      if (entry.recurringMinor !== undefined) {
        items.set(entry.key, {
          ...existing,
          recurringMinor: (existing.recurringMinor ?? 0) + entry.recurringMinor,
        });
      }
      return;
    }
    items.set(entry.key, {
      ...entry,
      recurringMinor: entry.recurringMinor ?? null,
      lastPeriodMinor: entry.categoryId ? (lastPeriod.get(entry.categoryId) ?? null) : null,
    });
  };

  for (const rule of facts.recurringExpenses) {
    if (rule.currency !== currency) continue;
    const category = active.find((candidate) => candidate.id === rule.categoryId);
    const name = category?.name ?? rule.name;
    const { key, categoryId } = category
      ? { key: categoryKey(category.id), categoryId: category.id }
      : resolveItemKey(rule.name, categories);
    add({
      key,
      name,
      group: "bills",
      categoryId,
      defaultTicked: true,
      recurringMinor: monthlyEquivalentMinor(rule, currency),
    });
  }
  for (const top of facts.topCategories) {
    add({
      key: categoryKey(top.categoryId),
      name: top.name,
      group: "everyday",
      categoryId: top.categoryId,
      defaultTicked: true,
    });
  }
  for (const preset of SETUP_PRESETS) {
    const { key, categoryId } = resolveItemKey(preset.name, categories);
    add({ key, name: preset.name, group: preset.group, categoryId, defaultTicked: false });
  }
  for (const item of custom) {
    const { key, categoryId } = resolveItemKey(item.name, categories);
    add({ key, name: item.name, group: item.group, categoryId, defaultTicked: false });
  }

  return [...items.values()].sort(
    (left, right) => GROUP_ORDER.indexOf(left.group) - GROUP_ORDER.indexOf(right.group),
  );
}

export const isItemTicked = (
  item: SetupItem,
  selection: Readonly<Record<string, boolean>>,
): boolean => selection[item.key] ?? item.defaultTicked;

/** What "Use suggestions" fills in: the usual Recurring amount, else last period's spend. */
export const suggestedMinor = (item: SetupItem, currency: string): number | null =>
  item.recurringMinor ??
  (item.lastPeriodMinor ? roundToWholeUnit(item.lastPeriodMinor, currency) : null);

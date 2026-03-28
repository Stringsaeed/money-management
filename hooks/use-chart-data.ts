import { useMemo } from "react";
import { format, parseISO, startOfMonth } from "date-fns";

import type { TransactionWithDetails } from "@/types";

export interface CategorySpendingDatum {
  category: string;
  amount: number;
  color: string;
  icon: string;
  [key: string]: unknown;
}

export interface MonthlyTrendDatum {
  month: number;
  label: string;
  income: number;
  expense: number;
  [key: string]: unknown;
}

export function useCategorySpending(
  transactions: TransactionWithDetails[],
): CategorySpendingDatum[] {
  return useMemo(() => {
    const map = new Map<string, { amount: number; color: string; icon: string }>();
    const insertionOrder: string[] = [];

    for (const t of transactions) {
      if (t.type !== "expense" || !t.category) continue;
      const key = t.category.name;
      const existing = map.get(key);
      if (existing) {
        existing.amount += t.amount;
      } else {
        map.set(key, { amount: t.amount, color: t.category.color, icon: t.category.icon });
        insertionOrder.push(key);
      }
    }

    return insertionOrder.slice(0, 8).map((category) => {
      const { amount, color, icon } = map.get(category)!;
      return { category, amount, color, icon };
    });
  }, [transactions]);
}

export function useMonthlyTrend(transactions: TransactionWithDetails[]): MonthlyTrendDatum[] {
  return useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>();

    for (const t of transactions) {
      if (t.type === "transfer") continue;
      const monthKey = format(startOfMonth(parseISO(t.date)), "yyyy-MM");
      const existing = map.get(monthKey);
      if (existing) {
        if (t.type === "income") existing.income += t.amount;
        else existing.expense += t.amount;
      } else {
        map.set(monthKey, {
          income: t.type === "income" ? t.amount : 0,
          expense: t.type === "expense" ? t.amount : 0,
        });
      }
    }

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([key, data], index) => ({
        month: index,
        label: format(parseISO(key + "-01"), "MMM"),
        income: data.income / 100,
        expense: data.expense / 100,
      }));
  }, [transactions]);
}

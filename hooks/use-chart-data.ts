import { format, parseISO } from "date-fns";

import type { TransactionWithDetails } from "@/types";

interface CategorySpendingDatum {
  category: string;
  amount: number;
  color: string;
  icon: string;
  [key: string]: unknown;
}

interface TransactionPointDatum {
  index: number;
  label: string;
  amount: number;
  [key: string]: unknown;
}

export function useCategorySpending(
  transactions: TransactionWithDetails[],
): CategorySpendingDatum[] {
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
}

export function useTransactionPoints(
  transactions: TransactionWithDetails[],
): TransactionPointDatum[] {
  const sorted = [...transactions]
    .filter((t) => t.type !== "transfer")
    .sort((a, b) => a.date.localeCompare(b.date));

  let balance = 0;
  return sorted.map((t, index) => {
    balance += t.type === "income" ? t.amount : -t.amount;
    return {
      index,
      label: format(parseISO(t.date), "d MMM"),
      amount: balance / 100,
    };
  });
}

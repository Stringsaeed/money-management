import type { QueryClient } from "@tanstack/react-query";

import type { RecurringEffect } from "@/modules/recurring-rules";

export const recurringRuleKeys = {
  all: ["recurring-rules"] as const,
  list: (filter: "current" | "archived" | "needs_attention") =>
    ["recurring-rules", "list", filter] as const,
  detail: (ruleId: string) => ["recurring-rules", "detail", ruleId] as const,
  upcoming: (limit: number) => ["recurring-rules", "upcoming", limit] as const,
};

const effectQueryKeys: Record<RecurringEffect, readonly (readonly unknown[])[]> = {
  rules: [["recurring-rules"]],
  upcoming: [["recurring-rules", "upcoming"]],
  ledger: [["transactions"]],
  balances: [["account-balances"]],
  summaries: [["month-summary"], ["transaction-date-range"]],
};

export async function invalidateRecurringEffects(
  queryClient: QueryClient,
  effects: RecurringEffect[],
): Promise<void> {
  const queryKeys = [...new Set(effects.flatMap((effect) => effectQueryKeys[effect]))];
  await Promise.all(queryKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
}

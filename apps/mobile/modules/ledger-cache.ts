import { hashKey, partialMatchKey, type QueryClient, type QueryKey } from "@tanstack/react-query";

import type { RecurringEffect } from "@/modules/recurring-rules";
import type { Transaction } from "@/types";

export interface TransactionQueryFilters {
  year?: number;
  month?: number;
  accountId?: string | null;
  categoryId?: string | null;
  type?: Transaction["type"];
  isRecurring?: boolean;
  startsOnOrAfter?: string;
  sort?: "asc" | "desc";
  limit?: number;
}

export const accountKeys = {
  all: ["accounts"] as const,
  balances: ["account-balances"] as const,
  detail: (id: string) => ["accounts", id] as const,
};

export const categoryKeys = {
  all: ["categories"] as const,
  byType: (type: "income" | "expense") => ["categories", type] as const,
  detail: (id: string) => ["categories", id] as const,
};

export const transactionKeys = {
  all: ["transactions"] as const,
  list: (filters: TransactionQueryFilters) => ["transactions", "list", filters] as const,
  recent: (limit: number) => ["transactions", "recent", limit] as const,
  detail: (id: string) => ["transactions", id] as const,
};

export const monthSummaryKeys = {
  all: ["month-summary"] as const,
  detail: (year: number, month: number, accountId?: string | null) =>
    ["month-summary", year, month, accountId] as const,
};

export const transactionDateRangeKeys = {
  all: ["transaction-date-range"] as const,
};

export const recurringRuleKeys = {
  all: ["recurring-rules"] as const,
  list: (filter: "current" | "archived" | "needs_attention") =>
    ["recurring-rules", "list", filter] as const,
  detail: (ruleId: string) => ["recurring-rules", "detail", ruleId] as const,
  upcomingAll: ["recurring-rules", "upcoming"] as const,
  upcoming: (limit: number) => ["recurring-rules", "upcoming", limit] as const,
};

export const budgetKeys = {
  all: ["budgeting"] as const,
  workspaces: ["budgeting", "workspaces"] as const,
  projections: ["budgeting", "projections"] as const,
  projection: (currency: string, period: string) =>
    ["budgeting", "projections", currency, period] as const,
};

export type BudgetEffect = "workspaces" | "projections";

export type LedgerChange =
  | { kind: "account.created"; id: string }
  | { kind: "account.updated"; id: string }
  | { kind: "account.deleted"; id: string }
  | { kind: "category.created"; id: string }
  | { kind: "category.batch" }
  | { kind: "category.updated"; id: string }
  | { kind: "category.deleted"; id: string }
  | { kind: "transaction.created"; id: string }
  | { kind: "transaction.updated"; id: string }
  | { kind: "transaction.deleted"; id: string }
  | { kind: "ledger.reset" };

type EntityLedgerChange = Exclude<LedgerChange, { kind: "ledger.reset" }>;

const transactionChangeQueryKeys = [
  transactionKeys.all,
  accountKeys.balances,
  monthSummaryKeys.all,
  transactionDateRangeKeys.all,
  budgetKeys.projections,
] as const;

const ledgerChangeQueryKeys: Record<EntityLedgerChange["kind"], readonly QueryKey[]> = {
  "account.created": [accountKeys.all, accountKeys.balances, budgetKeys.projections],
  "account.updated": [
    accountKeys.all,
    accountKeys.balances,
    transactionKeys.all,
    recurringRuleKeys.all,
    budgetKeys.projections,
  ],
  "account.deleted": [
    accountKeys.all,
    accountKeys.balances,
    transactionKeys.all,
    monthSummaryKeys.all,
    transactionDateRangeKeys.all,
    recurringRuleKeys.all,
    budgetKeys.projections,
  ],
  "category.created": [categoryKeys.all],
  "category.batch": [categoryKeys.all, transactionKeys.all],
  "category.updated": [categoryKeys.all, transactionKeys.all],
  "category.deleted": [categoryKeys.all, transactionKeys.all, recurringRuleKeys.all],
  "transaction.created": transactionChangeQueryKeys,
  "transaction.updated": transactionChangeQueryKeys,
  "transaction.deleted": transactionChangeQueryKeys,
};

const recurringEffectQueryKeys: Record<RecurringEffect, readonly QueryKey[]> = {
  rules: [recurringRuleKeys.all],
  upcoming: [recurringRuleKeys.upcomingAll],
  ledger: [transactionKeys.all, budgetKeys.projections],
  balances: [accountKeys.balances],
  summaries: [monthSummaryKeys.all, transactionDateRangeKeys.all],
};

const budgetEffectQueryKeys: Record<BudgetEffect, readonly QueryKey[]> = {
  workspaces: [budgetKeys.workspaces, budgetKeys.projections],
  projections: [budgetKeys.projections],
};

export async function cohereLedgerCache(
  queryClient: QueryClient,
  change: LedgerChange,
): Promise<void> {
  if (change.kind === "ledger.reset") {
    await queryClient.invalidateQueries();
    return;
  }

  await invalidateQueryKeys(queryClient, ledgerChangeQueryKeys[change.kind]);
}

export async function cohereRecurringEffects(
  queryClient: QueryClient,
  effects: readonly RecurringEffect[],
): Promise<void> {
  await invalidateQueryKeys(
    queryClient,
    effects.flatMap((effect) => recurringEffectQueryKeys[effect]),
  );
}

export async function cohereBudgetingEffects(
  queryClient: QueryClient,
  effects: readonly BudgetEffect[],
): Promise<void> {
  await invalidateQueryKeys(
    queryClient,
    effects.flatMap((effect) => budgetEffectQueryKeys[effect]),
  );
}

async function invalidateQueryKeys(
  queryClient: QueryClient,
  queryKeys: readonly QueryKey[],
): Promise<void> {
  const uniqueQueryKeys = [
    ...new Map(queryKeys.map((queryKey) => [hashKey(queryKey), queryKey])).values(),
  ];
  const minimalQueryKeys = uniqueQueryKeys.filter(
    (queryKey) =>
      !uniqueQueryKeys.some(
        (possibleAncestor) =>
          possibleAncestor.length < queryKey.length && partialMatchKey(queryKey, possibleAncestor),
      ),
  );

  await Promise.all(
    minimalQueryKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
  );
}

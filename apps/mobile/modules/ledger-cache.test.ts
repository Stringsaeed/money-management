import { type QueryClient, type QueryKey } from "@tanstack/react-query";

import type { RecurringEffect } from "@/modules/recurring-rules";

import {
  accountKeys,
  budgetKeys,
  categoryKeys,
  cohereBudgetingEffects,
  cohereLedgerCache,
  cohereRecurringEffects,
  monthSummaryKeys,
  recurringRuleKeys,
  transactionDateRangeKeys,
  transactionKeys,
  type LedgerChange,
  type BudgetEffect,
  type TransactionQueryFilters,
} from "./ledger-cache";

const createControlledQueryClient = () => {
  const invalidateQueries = jest.fn().mockResolvedValue(undefined);
  return {
    invalidateQueries,
    queryClient: { invalidateQueries } as unknown as QueryClient,
  };
};

const invalidatedKeys = (invalidateQueries: jest.Mock) =>
  invalidateQueries.mock.calls.map(([filters]) => filters?.queryKey as QueryKey | undefined);

describe("ledger query keys", () => {
  it("preserves every existing ledger query-key shape", () => {
    const filters: TransactionQueryFilters = {
      year: 2026,
      month: 8,
      accountId: "account-1",
      categoryId: "category-1",
      type: "expense",
      isRecurring: true,
      startsOnOrAfter: "2026-08-01",
      sort: "asc",
      limit: 12,
    };

    expect({
      accountAll: accountKeys.all,
      accountManagement: accountKeys.management,
      accountBalances: accountKeys.balances,
      accountManagementBalances: accountKeys.managementBalances,
      accountDetail: accountKeys.detail("account-1"),
      categoryAll: categoryKeys.all,
      categoryManagement: categoryKeys.management,
      categoryByType: categoryKeys.byType("income"),
      categoryDetail: categoryKeys.detail("category-1"),
      transactionAll: transactionKeys.all,
      transactionList: transactionKeys.list(filters),
      transactionRecent: transactionKeys.recent(3),
      transactionDetail: transactionKeys.detail("transaction-1"),
      monthSummary: monthSummaryKeys.detail(2026, 8, "account-1"),
      transactionDateRange: transactionDateRangeKeys.all,
      recurringRuleAll: recurringRuleKeys.all,
      recurringRuleList: recurringRuleKeys.list("needs_attention"),
      recurringRuleDetail: recurringRuleKeys.detail("rule-1"),
      recurringRuleUpcoming: recurringRuleKeys.upcoming(3),
      budgetWorkspaces: budgetKeys.workspaces,
      budgetProjection: budgetKeys.projection("USD", "2026-08"),
    }).toEqual({
      accountAll: ["accounts"],
      accountManagement: ["accounts", "management"],
      accountBalances: ["account-balances"],
      accountManagementBalances: ["account-balances", "management"],
      accountDetail: ["accounts", "account-1"],
      categoryAll: ["categories"],
      categoryManagement: ["categories", "management"],
      categoryByType: ["categories", "income"],
      categoryDetail: ["categories", "category-1"],
      transactionAll: ["transactions"],
      transactionList: ["transactions", "list", filters],
      transactionRecent: ["transactions", "recent", 3],
      transactionDetail: ["transactions", "transaction-1"],
      monthSummary: ["month-summary", 2026, 8, "account-1"],
      transactionDateRange: ["transaction-date-range"],
      recurringRuleAll: ["recurring-rules"],
      recurringRuleList: ["recurring-rules", "list", "needs_attention"],
      recurringRuleDetail: ["recurring-rules", "detail", "rule-1"],
      recurringRuleUpcoming: ["recurring-rules", "upcoming", 3],
      budgetWorkspaces: ["budgeting", "workspaces"],
      budgetProjection: ["budgeting", "projections", "USD", "2026-08"],
    });
  });
});

describe("cohereBudgetingEffects", () => {
  it.each<{ effect: BudgetEffect; expectedKeys: QueryKey[] }>([
    {
      effect: "workspaces",
      expectedKeys: [
        ["budgeting", "workspaces"],
        ["budgeting", "projections"],
      ],
    },
    { effect: "projections", expectedKeys: [["budgeting", "projections"]] },
  ])("maps $effect through the centralized coherence owner", async ({ effect, expectedKeys }) => {
    const { invalidateQueries, queryClient } = createControlledQueryClient();

    await cohereBudgetingEffects(queryClient, [effect]);

    expect(invalidatedKeys(invalidateQueries)).toEqual(expectedKeys);
  });
});

describe("cohereLedgerCache", () => {
  it.each<{
    change: LedgerChange;
    expectedKeys: QueryKey[];
  }>([
    {
      change: { kind: "account.created", id: "account-1" },
      expectedKeys: [["accounts"], ["account-balances"], ["budgeting", "projections"]],
    },
    {
      change: { kind: "account.updated", id: "account-1" },
      expectedKeys: [
        ["accounts"],
        ["account-balances"],
        ["transactions"],
        ["recurring-rules"],
        ["budgeting", "projections"],
      ],
    },
    {
      change: { kind: "account.archived", id: "account-1" },
      expectedKeys: [
        ["accounts"],
        ["account-balances"],
        ["transactions"],
        ["recurring-rules"],
        ["budgeting", "projections"],
      ],
    },
    {
      change: { kind: "account.restored", id: "account-1" },
      expectedKeys: [
        ["accounts"],
        ["account-balances"],
        ["recurring-rules"],
        ["budgeting", "projections"],
      ],
    },
    {
      change: { kind: "account.deleted", id: "account-1" },
      expectedKeys: [
        ["accounts"],
        ["account-balances"],
        ["transactions"],
        ["month-summary"],
        ["transaction-date-range"],
        ["recurring-rules"],
        ["budgeting", "projections"],
      ],
    },
    {
      change: { kind: "category.created", id: "category-1" },
      expectedKeys: [["categories"]],
    },
    {
      change: { kind: "category.batch" },
      expectedKeys: [["categories"], ["transactions"]],
    },
    {
      change: { kind: "category.updated", id: "category-1" },
      expectedKeys: [["categories"], ["transactions"]],
    },
    {
      change: { kind: "category.archived", id: "category-1" },
      expectedKeys: [
        ["categories"],
        ["transactions"],
        ["recurring-rules"],
        ["budgeting", "projections"],
      ],
    },
    {
      change: { kind: "category.restored", id: "category-1" },
      expectedKeys: [["categories"], ["recurring-rules"], ["budgeting", "projections"]],
    },
    {
      change: { kind: "category.deleted", id: "category-1" },
      expectedKeys: [
        ["categories"],
        ["transactions"],
        ["recurring-rules"],
        ["budgeting", "projections"],
      ],
    },
    {
      change: { kind: "transaction.created", id: "transaction-1" },
      expectedKeys: [
        ["transactions"],
        ["account-balances"],
        ["month-summary"],
        ["transaction-date-range"],
        ["budgeting", "projections"],
      ],
    },
    {
      change: { kind: "transaction.updated", id: "transaction-1" },
      expectedKeys: [
        ["transactions"],
        ["account-balances"],
        ["month-summary"],
        ["transaction-date-range"],
        ["budgeting", "projections"],
      ],
    },
    {
      change: { kind: "transaction.deleted", id: "transaction-1" },
      expectedKeys: [
        ["transactions"],
        ["account-balances"],
        ["month-summary"],
        ["transaction-date-range"],
        ["budgeting", "projections"],
      ],
    },
  ])("maps $change.kind to every affected projection", async ({ change, expectedKeys }) => {
    const { invalidateQueries, queryClient } = createControlledQueryClient();

    await cohereLedgerCache(queryClient, change);

    expect(invalidatedKeys(invalidateQueries)).toEqual(expectedKeys);
  });

  it("invalidates every cached query for a full ledger reset", async () => {
    const { invalidateQueries, queryClient } = createControlledQueryClient();

    await cohereLedgerCache(queryClient, { kind: "ledger.reset" });

    expect(invalidateQueries).toHaveBeenCalledTimes(1);
    expect(invalidateQueries).toHaveBeenCalledWith();
  });
});

describe("cohereRecurringEffects", () => {
  it.each<{ effect: RecurringEffect; expectedKeys: QueryKey[] }>([
    { effect: "rules", expectedKeys: [["recurring-rules"]] },
    { effect: "upcoming", expectedKeys: [["recurring-rules", "upcoming"]] },
    {
      effect: "ledger",
      expectedKeys: [["transactions"], ["budgeting", "projections"]],
    },
    { effect: "balances", expectedKeys: [["account-balances"]] },
    {
      effect: "summaries",
      expectedKeys: [["month-summary"], ["transaction-date-range"]],
    },
  ])("maps the $effect effect to every affected projection", async ({ effect, expectedKeys }) => {
    const { invalidateQueries, queryClient } = createControlledQueryClient();

    await cohereRecurringEffects(queryClient, [effect]);

    expect(invalidatedKeys(invalidateQueries)).toEqual(expectedKeys);
  });
});

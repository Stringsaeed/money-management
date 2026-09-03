import { type QueryClient, type QueryKey } from "@tanstack/react-query";

import type { RecurringEffect } from "@/modules/recurring-rules";

import {
  accountKeys,
  budgetKeys,
  categoryKeys,
  cohereBudgetingEffects,
  cohereLedgerCache,
  cohereLedgerEffects,
  cohereOutboxSettlement,
  cohereRecurringEffects,
  cohereTransactionSurfaces,
  ledgerAuthorizationKeys,
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
      accountBalances: accountKeys.balances,
      accountManagementBalances: accountKeys.managementBalances,
      accountDetail: accountKeys.detail("account-1"),
      accountArchivalPreview: accountKeys.archivalPreview("account-1", "2026-08-18"),
      accountDeletionPreview: accountKeys.deletionPreview("account-1"),
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
      envelopeFormOptions: budgetKeys.envelopeFormOptionsFor("USD", "2026-08"),
      setupDraft: budgetKeys.setupDraft,
    }).toEqual({
      accountAll: ["accounts"],
      accountBalances: ["account-balances"],
      accountManagementBalances: ["account-balances", "management"],
      accountDetail: ["accounts", "account-1"],
      accountArchivalPreview: ["account-lifecycle-previews", "archival", "account-1", "2026-08-18"],
      accountDeletionPreview: ["account-lifecycle-previews", "deletion", "account-1"],
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
      envelopeFormOptions: ["budgeting", "envelope-form-options", "USD", "2026-08"],
      setupDraft: ["budgeting", "setup-draft", "guided-envelope-setup"],
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
        ["account-lifecycle-previews"],
      ],
    },
    {
      effect: "memberships",
      expectedKeys: [["budgeting", "projections"], ["account-lifecycle-previews"]],
    },
    {
      effect: "envelopes",
      expectedKeys: [
        ["budgeting", "projections"],
        ["budgeting", "envelope-form-options"],
        ["account-lifecycle-previews"],
      ],
    },
    {
      effect: "projections",
      expectedKeys: [["budgeting", "projections"], ["account-lifecycle-previews"]],
    },
    {
      effect: "settings",
      expectedKeys: [["budgeting", "workspaces"]],
    },
  ])("maps $effect through the centralized coherence owner", async ({ effect, expectedKeys }) => {
    const { invalidateQueries, queryClient } = createControlledQueryClient();

    await cohereBudgetingEffects(queryClient, [effect]);

    expect(invalidatedKeys(invalidateQueries)).toEqual(expectedKeys);
  });

  it("invalidates overlapping workspace effects only once", async () => {
    const { invalidateQueries, queryClient } = createControlledQueryClient();

    await cohereBudgetingEffects(queryClient, ["workspaces", "memberships", "settings"]);

    expect(invalidatedKeys(invalidateQueries)).toEqual([
      ["budgeting", "workspaces"],
      ["budgeting", "projections"],
      ["account-lifecycle-previews"],
    ]);
  });
});

describe("cohereLedgerCache", () => {
  it.each<{
    change: LedgerChange;
    expectedKeys: QueryKey[];
  }>([
    {
      change: { kind: "account.created", id: "account-1" },
      expectedKeys: [
        ["accounts"],
        ["account-balances"],
        ["budgeting", "projections"],
        ["budgeting", "setup-draft", "guided-envelope-setup"],
      ],
    },
    {
      change: { kind: "account.updated", id: "account-1" },
      expectedKeys: [
        ["accounts"],
        ["account-balances"],
        ["transactions"],
        ["recurring-rules"],
        ["budgeting", "projections"],
        ["account-lifecycle-previews"],
        ["budgeting", "setup-draft", "guided-envelope-setup"],
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
        ["account-lifecycle-previews"],
        ["budgeting", "setup-draft", "guided-envelope-setup"],
      ],
    },
    {
      change: { kind: "account.restored", id: "account-1" },
      expectedKeys: [
        ["accounts"],
        ["account-balances"],
        ["recurring-rules"],
        ["budgeting", "projections"],
        ["account-lifecycle-previews"],
        ["budgeting", "setup-draft", "guided-envelope-setup"],
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
        ["account-lifecycle-previews"],
        ["budgeting", "setup-draft", "guided-envelope-setup"],
      ],
    },
    {
      change: { kind: "category.created", id: "category-1" },
      expectedKeys: [
        ["categories"],
        ["budgeting", "envelope-form-options"],
        ["budgeting", "setup-draft", "guided-envelope-setup"],
      ],
    },
    {
      change: { kind: "category.batch" },
      expectedKeys: [
        ["categories"],
        ["transactions"],
        ["budgeting", "envelope-form-options"],
        ["budgeting", "setup-draft", "guided-envelope-setup"],
      ],
    },
    {
      change: { kind: "category.updated", id: "category-1" },
      expectedKeys: [
        ["categories"],
        ["transactions"],
        ["budgeting", "envelope-form-options"],
        ["budgeting", "setup-draft", "guided-envelope-setup"],
      ],
    },
    {
      change: { kind: "category.archived", id: "category-1" },
      expectedKeys: [
        ["categories"],
        ["transactions"],
        ["recurring-rules"],
        ["budgeting", "projections"],
        ["account-lifecycle-previews"],
        ["budgeting", "envelope-form-options"],
        ["budgeting", "setup-draft", "guided-envelope-setup"],
      ],
    },
    {
      change: { kind: "category.restored", id: "category-1" },
      expectedKeys: [
        ["categories"],
        ["recurring-rules"],
        ["budgeting", "projections"],
        ["account-lifecycle-previews"],
        ["budgeting", "envelope-form-options"],
        ["budgeting", "setup-draft", "guided-envelope-setup"],
      ],
    },
    {
      change: { kind: "category.deleted", id: "category-1" },
      expectedKeys: [
        ["categories"],
        ["transactions"],
        ["recurring-rules"],
        ["budgeting", "projections"],
        ["account-lifecycle-previews"],
        ["budgeting", "envelope-form-options"],
        ["budgeting", "setup-draft", "guided-envelope-setup"],
      ],
    },
    {
      change: { kind: "transaction.created", id: "transaction-1" },
      expectedKeys: [
        ["transactions"],
        ["accounts"],
        ["account-balances"],
        ["month-summary"],
        ["transaction-date-range"],
        ["budgeting", "projections"],
        ["budgeting", "envelope-form-options"],
        ["account-lifecycle-previews"],
        ["budgeting", "setup-draft", "guided-envelope-setup"],
      ],
    },
    {
      change: { kind: "transaction.updated", id: "transaction-1" },
      expectedKeys: [
        ["transactions"],
        ["accounts"],
        ["account-balances"],
        ["month-summary"],
        ["transaction-date-range"],
        ["budgeting", "projections"],
        ["budgeting", "envelope-form-options"],
        ["account-lifecycle-previews"],
        ["budgeting", "setup-draft", "guided-envelope-setup"],
      ],
    },
    {
      change: { kind: "transaction.deleted", id: "transaction-1" },
      expectedKeys: [
        ["transactions"],
        ["accounts"],
        ["account-balances"],
        ["month-summary"],
        ["transaction-date-range"],
        ["budgeting", "projections"],
        ["budgeting", "envelope-form-options"],
        ["account-lifecycle-previews"],
        ["budgeting", "setup-draft", "guided-envelope-setup"],
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

describe("cohereTransactionSurfaces", () => {
  it("invalidates Account picker keys after outbox settlement", async () => {
    const { queryClient, invalidateQueries } = createControlledQueryClient();

    await cohereTransactionSurfaces(queryClient);

    expect(invalidatedKeys(invalidateQueries)).toEqual(
      expect.arrayContaining([accountKeys.all, accountKeys.balances, transactionKeys.all]),
    );
  });
});

describe("cohereOutboxSettlement", () => {
  it("invalidates Account, Transaction, and authorization keys after drain", async () => {
    const { queryClient, invalidateQueries } = createControlledQueryClient();

    await cohereOutboxSettlement(queryClient);

    expect(invalidatedKeys(invalidateQueries)).toEqual(
      expect.arrayContaining([
        accountKeys.all,
        accountKeys.balances,
        transactionKeys.all,
        ledgerAuthorizationKeys.accounts,
      ]),
    );
  });
});

describe("cohereLedgerEffects", () => {
  it("maps synced Effect Tags onto the existing resource cache keys", async () => {
    const { queryClient, invalidateQueries } = createControlledQueryClient();

    await cohereLedgerEffects(queryClient, ["ledger", "balances", "summaries", "members"]);

    expect(invalidatedKeys(invalidateQueries)).toEqual([
      accountKeys.all,
      accountKeys.balances,
      transactionKeys.all,
      ledgerAuthorizationKeys.accounts,
      categoryKeys.all,
      monthSummaryKeys.all,
      transactionDateRangeKeys.all,
    ]);
  });
});

describe("cohereRecurringEffects", () => {
  it.each<{ effect: RecurringEffect; expectedKeys: QueryKey[] }>([
    {
      effect: "rules",
      expectedKeys: [["recurring-rules"], ["account-lifecycle-previews"]],
    },
    { effect: "upcoming", expectedKeys: [["recurring-rules", "upcoming"]] },
    {
      effect: "ledger",
      expectedKeys: [
        ["transactions"],
        ["budgeting", "projections"],
        ["account-lifecycle-previews"],
        ["budgeting", "setup-draft", "guided-envelope-setup"],
      ],
    },
    {
      effect: "balances",
      expectedKeys: [["account-balances"], ["budgeting", "setup-draft", "guided-envelope-setup"]],
    },
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

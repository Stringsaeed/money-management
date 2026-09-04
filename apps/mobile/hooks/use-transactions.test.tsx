import { act, waitFor } from "@testing-library/react-native";
import type { QueryClient } from "@tanstack/react-query";

import { transactions } from "@/db/schema";
import {
  useCreateTransaction,
  useDeleteTransaction,
  useLinkRefund,
  useMonthSummary,
  useTransaction,
  useTransactionDateRange,
  useTransactionPage,
  useTransactions,
  useUpdateTransaction,
} from "@/hooks/use-transactions";
import type { LedgerChange } from "@/modules/ledger-cache";
import { createTransaction, createTransactionWithDetails } from "@/tests/test-utils/factories";
import { createMockDb } from "@/tests/test-utils/mock-db";
import { renderHookWithProviders } from "@/tests/test-utils/render";

const mockUseDatabase = jest.fn();
const mockCohereLedgerCache = jest.fn();
const mockUseAccountVisibility = jest.fn();
const mockListServerAccounts = jest.fn();
const mockListServerCategories = jest.fn();
const mockListServerTransactions = jest.fn();
const mockEnqueueCommand = jest.fn();
const mockListProjectableCommands = jest.fn();
const mockApply = jest.fn();
const mockReadSnapshot = jest.fn();
const mockWriteSnapshot = jest.fn();

interface CoherenceAwareMutation<T> {
  expectMutationPendingUntilCoherence: () => void;
  resolve: () => Promise<T>;
}

async function startMutationAwaitingCoherence<T>(
  startMutation: () => Promise<T>,
): Promise<CoherenceAwareMutation<T>> {
  let settleCoherence!: () => void;
  mockCohereLedgerCache.mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        settleCoherence = resolve;
      }),
  );
  let mutationSettled = false;
  let mutation!: Promise<T>;

  await act(async () => {
    mutation = startMutation();
    mutation.then(() => {
      mutationSettled = true;
    });
  });

  return {
    expectMutationPendingUntilCoherence: () => {
      expect(mutationSettled).toBe(false);
    },
    resolve: async () => {
      let value!: T;
      await act(async () => {
        settleCoherence();
        value = await mutation;
      });
      return value;
    },
  };
}

async function resolveMutationAfterSemanticCoherence<T>(
  mutation: CoherenceAwareMutation<T>,
  queryClient: QueryClient,
  change: LedgerChange,
): Promise<T> {
  await waitFor(() => {
    expect(mockCohereLedgerCache).toHaveBeenCalledWith(queryClient, change);
  });
  mutation.expectMutationPendingUntilCoherence();
  return mutation.resolve();
}

jest.mock("@/db/client", () => ({
  useDatabase: () => mockUseDatabase(),
}));

jest.mock("@/lib/server/orpc", () => ({
  orpc: {
    ledger: {
      accounts: { list: (...args: unknown[]) => mockListServerAccounts(...args) },
      categories: { list: (...args: unknown[]) => mockListServerCategories(...args) },
      transactions: { list: (...args: unknown[]) => mockListServerTransactions(...args) },
    },
    commands: { apply: (...args: unknown[]) => mockApply(...args) },
    sync: { getDelta: jest.fn() },
  },
}));

jest.mock("@/lib/sync/outbox", () => ({
  ...jest.requireActual("@/lib/sync/outbox"),
  enqueueCommand: (...args: unknown[]) => mockEnqueueCommand(...args),
  listProjectableCommands: (...args: unknown[]) => mockListProjectableCommands(...args),
}));

jest.mock("@/modules/ledger-data-source/synced-transaction-snapshot", () => ({
  readSyncedTransactionSnapshot: (...args: unknown[]) => mockReadSnapshot(...args),
  writeSyncedTransactionSnapshot: (...args: unknown[]) => mockWriteSnapshot(...args),
}));

jest.mock("@/hooks/use-account-visibility", () => ({
  hasVisibleAccount: (
    visibility: { isFiltering: boolean; visibleAccountIds: Set<string> },
    id: string,
  ) => !visibility.isFiltering || visibility.visibleAccountIds.has(id),
  useAccountVisibility: () => mockUseAccountVisibility(),
}));

jest.mock("@/utils/id", () => ({
  generateId: jest.fn(() => "generated-transaction-id"),
}));

jest.mock("@/utils/date", () => {
  const actual = jest.requireActual("@/utils/date");

  return {
    ...actual,
    nowIso: jest.fn(() => "2026-03-28T12:00:00.000Z"),
  };
});

jest.mock("@/modules/ledger-cache", () => ({
  ...jest.requireActual("@/modules/ledger-cache"),
  cohereLedgerCache: (...args: unknown[]) => mockCohereLedgerCache(...args),
}));

describe("use-transactions hooks", () => {
  beforeEach(() => {
    mockUseAccountVisibility.mockReturnValue({
      cacheKey: "local-only",
      isFiltering: false,
      visibleAccountIds: new Set(),
    });
    mockCohereLedgerCache.mockResolvedValue(undefined);
    mockEnqueueCommand.mockResolvedValue(undefined);
    mockListProjectableCommands.mockResolvedValue([]);
    mockApply.mockResolvedValue({
      kind: "applied",
      seq: 1,
      effects: [],
      applied: {},
      replayed: false,
    });
    mockReadSnapshot.mockRejectedValue(
      new Error("No authoritative synced Transaction snapshot is cached for this household."),
    );
    mockWriteSnapshot.mockResolvedValue(undefined);
  });
  it("loads and enriches transaction lists via JOIN", async () => {
    const db = createMockDb({
      selectResults: [
        {
          all: [
            {
              // Transaction columns
              id: "transaction-1",
              type: "expense",
              amount: 40_00,
              currency: "USD",
              originalAmount: null,
              originalCurrency: null,
              exchangeRate: null,
              date: "2026-03-28",
              accountId: "account-1",
              toAccountId: null,
              categoryId: "category-1",
              isRecurring: true,
              recurringRuleId: null,
              description: "Coffee",
              createdAt: "2026-03-28T12:00:00.000Z",
              updatedAt: "2026-03-28T12:00:00.000Z",
              // Joined account columns
              accountName: "Main Checking",
              accountColor: "#8B9D83",
              accountIcon: "banknote.fill",
              accountCurrency: "USD",
              // Joined toAccount columns
              toAccountName: null,
              toAccountColor: null,
              toAccountIcon: null,
              toAccountCurrency: null,
              // Joined category columns
              categoryName: "Groceries",
              categoryColor: "#B48A7B",
              categoryIcon: "🛒",
            },
          ],
        },
      ],
    });
    mockUseDatabase.mockReturnValue(db);

    const { result } = await renderHookWithProviders(() =>
      useTransactions({ year: 2026, month: 3, accountId: "account-1" }),
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.source).toBe("local");
    expect(result.current.data).toEqual([
      createTransactionWithDetails({
        id: "transaction-1",
        amount: 40_00,
        date: "2026-03-28",
        isRecurring: true,
        account: {
          id: "account-1",
          name: "Main Checking",
          color: "#8B9D83",
          icon: "banknote.fill",
          currency: "USD",
        },
        category: {
          id: "category-1",
          name: "Groceries",
          color: "#B48A7B",
          icon: "🛒",
        },
      }),
    ]);
  });

  it("loads the same enriched Transaction shape from an explicitly synced source", async () => {
    const db = createMockDb({
      selectResults: [{ all: [] }],
    });
    mockUseDatabase.mockReturnValue(db);
    mockListServerAccounts.mockResolvedValue([
      {
        householdId: "household-1",
        id: "account-1",
        name: "Main Checking",
        type: "bank",
        currency: "USD",
        color: "#8B9D83",
        icon: "banknote.fill",
        initialBalanceMinor: 100_00,
        excludeFromTotal: false,
        sortOrder: 0,
        lifecycle: "active",
        lifecycleChangedAt: null,
        visibility: "public",
        ownerUserId: "user-1",
        version: 0,
        createdBy: "user-1",
        updatedBy: "user-1",
        createdAt: new Date("2026-03-28T10:00:00.000Z"),
        updatedAt: new Date("2026-03-28T10:00:00.000Z"),
      },
    ]);
    mockListServerCategories.mockResolvedValue([
      {
        householdId: "household-1",
        id: "category-1",
        name: "Groceries",
        type: "expense",
        color: "#B48A7B",
        icon: "🛒",
        parentId: null,
        sortOrder: 0,
        lifecycle: "active",
        lifecycleChangedAt: null,
        version: 0,
        createdBy: "user-1",
        updatedBy: "user-1",
        createdAt: new Date("2026-03-28T10:00:00.000Z"),
        updatedAt: new Date("2026-03-28T10:00:00.000Z"),
      },
    ]);
    mockListServerTransactions.mockResolvedValue({
      transactions: [
        {
          householdId: "household-1",
          id: "transaction-1",
          type: "expense",
          amountMinor: 40_00,
          currency: "USD",
          originalAmountMinor: null,
          originalCurrency: null,
          exchangeRate: null,
          date: "2026-03-28",
          accountId: "account-1",
          toAccountId: null,
          categoryId: "category-1",
          isRecurring: false,
          recurringRuleId: null,
          description: "Coffee",
          version: 0,
          createdBy: "user-1",
          updatedBy: "user-1",
          createdAt: new Date("2026-03-28T10:00:00.000Z"),
          updatedAt: new Date("2026-03-28T10:00:00.000Z"),
        },
      ],
      hasMore: false,
    });

    const { result } = await renderHookWithProviders(
      () => useTransactions({ year: 2026, month: 3, accountId: "account-1" }),
      { ledgerSelection: { kind: "synced", householdId: "household-1" } },
    );

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.error).toBeNull();

    expect(result.current.data).toEqual([
      createTransactionWithDetails({
        id: "transaction-1",
        amount: 40_00,
        date: "2026-03-28",
        createdAt: "2026-03-28T10:00:00.000Z",
        updatedAt: "2026-03-28T10:00:00.000Z",
      }),
    ]);
    expect(mockWriteSnapshot).toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalledWith(transactions);
    expect(db.update).not.toHaveBeenCalledWith(transactions);
    expect(db.delete).not.toHaveBeenCalledWith(transactions);
  });

  it("loads a transaction detail only when enabled", async () => {
    const detailDb = createMockDb({
      selectResults: [
        {
          get: {
            id: "transaction-1",
            type: "expense",
            amount: 50_00,
            currency: "USD",
            originalAmount: null,
            originalCurrency: null,
            exchangeRate: null,
            date: "2026-03-28",
            accountId: "account-1",
            toAccountId: null,
            categoryId: "category-1",
            isRecurring: false,
            recurringRuleId: null,
            description: "",
            createdAt: "2026-03-28T00:00:00.000Z",
            updatedAt: "2026-03-28T00:00:00.000Z",
            accountName: "Checking",
            accountColor: "#8B9D83",
            accountIcon: "banknote.fill",
            accountCurrency: "USD",
            toAccountName: null,
            toAccountColor: null,
            toAccountIcon: null,
            toAccountCurrency: null,
            categoryName: "Food",
            categoryColor: "#B48A7B",
            categoryIcon: "🍔",
          },
        },
      ],
    });
    mockUseDatabase.mockReturnValue(detailDb);

    const enabledHook = await renderHookWithProviders(() => useTransaction("transaction-1"));

    await waitFor(() => {
      expect(enabledHook.result.current.isSuccess).toBe(true);
    });

    expect(enabledHook.result.current.data?.id).toBe("transaction-1");

    const disabledDb = createMockDb();
    mockUseDatabase.mockReturnValue(disabledDb);

    const disabledHook = await renderHookWithProviders(() => useTransaction(undefined));

    await waitFor(() => {
      expect(disabledHook.result.current.fetchStatus).toBe("idle");
    });

    expect(disabledDb.select).not.toHaveBeenCalled();
  });

  it("returns the transaction date range", async () => {
    const db = createMockDb({
      selectResults: [
        {
          all: [
            { accountId: "account-1", date: "2026-01-01", toAccountId: null },
            { accountId: "account-1", date: "2026-03-28", toAccountId: null },
          ],
        },
      ],
    });
    mockUseDatabase.mockReturnValue(db);

    const { result } = await renderHookWithProviders(() => useTransactionDateRange());

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({ minDate: "2026-01-01", maxDate: "2026-03-28" });
  });

  it("pages older local Transactions before applying the limit", async () => {
    const db = createMockDb({
      selectResults: [
        {
          all: [
            createTransaction({ id: "older-1", date: "2026-01-20" }),
            createTransaction({ id: "older-2", date: "2026-01-19" }),
            createTransaction({ id: "older-3", date: "2026-01-18" }),
          ],
        },
      ],
    });
    mockUseDatabase.mockReturnValue(db);

    const { result } = await renderHookWithProviders(() =>
      useTransactionPage({ limit: 2, beforeDate: "2026-02-01" }),
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toMatchObject({
      transactions: [{ id: "older-1" }, { id: "older-2" }],
      hasMore: true,
    });
  });

  it("hides private transaction dates from local filter metadata", async () => {
    mockUseAccountVisibility.mockReturnValue({
      cacheKey: "household-1:shared-account",
      isFiltering: true,
      visibleAccountIds: new Set(["shared-account"]),
    });
    const db = createMockDb({
      selectResults: [
        {
          all: [
            { accountId: "private-account", date: "2026-01-01", toAccountId: null },
            { accountId: "shared-account", date: "2026-02-01", toAccountId: null },
          ],
        },
      ],
    });
    mockUseDatabase.mockReturnValue(db);

    const { result } = await renderHookWithProviders(() => useTransactionDateRange());

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.data).toEqual({ minDate: "2026-02-01", maxDate: "2026-02-01" });
  });

  it("computes a month summary", async () => {
    const db = createMockDb({
      selectResults: [
        {
          all: [
            createTransaction({ id: "income-1", type: "income", amount: 100_00 }),
            createTransaction({ id: "expense-1", type: "expense", amount: 30_00 }),
            createTransaction({ id: "transfer-1", type: "transfer", amount: 50_00 }),
          ],
        },
      ],
    });
    mockUseDatabase.mockReturnValue(db);

    const { result } = await renderHookWithProviders(() => useMonthSummary(2026, 3, "account-1"));

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({
      totalIncome: 100_00,
      totalExpense: 30_00,
      netAmount: 70_00,
    });
  });

  it("reports a committed Transaction creation and waits for coherent projections", async () => {
    const db = createMockDb();
    mockUseDatabase.mockReturnValue(db);

    const { result, client } = await renderHookWithProviders(() => useCreateTransaction());
    const mutation = await startMutationAwaitingCoherence(() =>
      result.current.mutateAsync({
        type: "expense",
        amount: 40_00,
        currency: "USD",
        originalAmount: null,
        originalCurrency: null,
        exchangeRate: null,
        date: "2026-03-28",
        accountId: "account-1",
        toAccountId: null,
        categoryId: "category-1",
        description: "Coffee",
        isRecurring: true,
        recurringRuleId: null,
      }),
    );

    expect(db.insert).toHaveBeenCalledWith(transactions);
    expect(db.__builders.insert.values).toHaveBeenCalledWith(
      expect.objectContaining({ isRecurring: true }),
    );
    await expect(
      resolveMutationAfterSemanticCoherence(mutation, client, {
        kind: "transaction.created",
        id: "generated-transaction-id",
      }),
    ).resolves.toBe("generated-transaction-id");
  });

  it("reports a committed Transaction update and waits for coherent projections", async () => {
    const db = createMockDb();
    mockUseDatabase.mockReturnValue(db);

    const { result, client } = await renderHookWithProviders(() => useUpdateTransaction());
    const mutation = await startMutationAwaitingCoherence(() =>
      result.current.mutateAsync({
        id: "transaction-1",
        data: { description: "Dinner" },
      }),
    );

    expect(db.update).toHaveBeenCalledWith(transactions);
    await resolveMutationAfterSemanticCoherence(mutation, client, {
      kind: "transaction.updated",
      id: "transaction-1",
    });
  });

  it("reports a committed Transaction deletion and waits for coherent projections", async () => {
    const db = createMockDb();
    mockUseDatabase.mockReturnValue(db);

    const { result, client } = await renderHookWithProviders(() => useDeleteTransaction());
    const mutation = await startMutationAwaitingCoherence(() =>
      result.current.mutateAsync("transaction-1"),
    );

    expect(db.delete).toHaveBeenCalledWith(transactions);
    await resolveMutationAfterSemanticCoherence(mutation, client, {
      kind: "transaction.deleted",
      id: "transaction-1",
    });
  });

  it("enqueues a synced create instead of inserting sqlite transactions or applying", async () => {
    const db = createMockDb();
    mockUseDatabase.mockReturnValue(db);

    const { result } = await renderHookWithProviders(() => useCreateTransaction(), {
      ledgerSelection: { kind: "synced", householdId: "household-1" },
    });

    await act(async () => {
      await result.current.mutateAsync({
        type: "expense",
        amount: 40_00,
        currency: "USD",
        originalAmount: null,
        originalCurrency: null,
        exchangeRate: null,
        date: "2026-03-28",
        accountId: "account-1",
        toAccountId: null,
        categoryId: "category-1",
        description: "Coffee",
        recurringRuleId: null,
      });
    });

    expect(mockEnqueueCommand).toHaveBeenCalledWith(
      db,
      expect.objectContaining({
        kind: "transaction.create",
        userId: "test-user",
      }),
    );
    expect(mockApply).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalledWith(transactions);
  });

  it("enqueues a synced update with expectedVersion and never updates sqlite transactions", async () => {
    const db = createMockDb();
    mockUseDatabase.mockReturnValue(db);
    mockReadSnapshot.mockResolvedValue({
      householdId: "household-1",
      userId: "test-user",
      accounts: [
        {
          householdId: "household-1",
          id: "account-1",
          name: "Main",
          type: "bank",
          currency: "USD",
          color: "#8B9D83",
          icon: "banknote.fill",
          initialBalanceMinor: 0,
          excludeFromTotal: false,
          sortOrder: 0,
          lifecycle: "active",
          lifecycleChangedAt: null,
          visibility: "public",
          ownerUserId: "user-1",
          version: 1,
          createdBy: "user-1",
          updatedBy: "user-1",
          createdAt: "2026-03-28T10:00:00.000Z",
          updatedAt: "2026-03-28T10:00:00.000Z",
        },
      ],
      categories: [],
      transactions: [
        {
          householdId: "household-1",
          id: "transaction-1",
          type: "expense",
          amountMinor: 40_00,
          currency: "USD",
          originalAmountMinor: null,
          originalCurrency: null,
          exchangeRate: null,
          date: "2026-03-28",
          accountId: "account-1",
          toAccountId: null,
          categoryId: "category-1",
          isRecurring: false,
          recurringRuleId: null,
          description: "Coffee",
          version: 4,
          createdBy: "user-1",
          updatedBy: "user-1",
          createdAt: "2026-03-28T10:00:00.000Z",
          updatedAt: "2026-03-28T10:00:00.000Z",
        },
      ],
    });

    const { result } = await renderHookWithProviders(() => useUpdateTransaction(), {
      ledgerSelection: { kind: "synced", householdId: "household-1" },
    });

    await act(async () => {
      await result.current.mutateAsync({
        id: "transaction-1",
        data: { description: "Dinner" },
      });
    });

    expect(mockEnqueueCommand).toHaveBeenCalledWith(
      db,
      expect.objectContaining({
        kind: "transaction.edit",
        preconditions: [{ entityId: "transaction-1", expectedVersion: 4 }],
      }),
    );
    expect(mockApply).not.toHaveBeenCalled();
    expect(db.update).not.toHaveBeenCalledWith(transactions);
  });

  it("enqueues a synced delete and never deletes sqlite transactions", async () => {
    const db = createMockDb();
    mockUseDatabase.mockReturnValue(db);
    mockReadSnapshot.mockResolvedValue({
      householdId: "household-1",
      userId: "test-user",
      accounts: [
        {
          householdId: "household-1",
          id: "account-1",
          name: "Main",
          type: "bank",
          currency: "USD",
          color: "#8B9D83",
          icon: "banknote.fill",
          initialBalanceMinor: 0,
          excludeFromTotal: false,
          sortOrder: 0,
          lifecycle: "active",
          lifecycleChangedAt: null,
          visibility: "public",
          ownerUserId: "user-1",
          version: 1,
          createdBy: "user-1",
          updatedBy: "user-1",
          createdAt: "2026-03-28T10:00:00.000Z",
          updatedAt: "2026-03-28T10:00:00.000Z",
        },
      ],
      categories: [],
      transactions: [
        {
          householdId: "household-1",
          id: "transaction-1",
          type: "expense",
          amountMinor: 40_00,
          currency: "USD",
          originalAmountMinor: null,
          originalCurrency: null,
          exchangeRate: null,
          date: "2026-03-28",
          accountId: "account-1",
          toAccountId: null,
          categoryId: "category-1",
          isRecurring: false,
          recurringRuleId: null,
          description: "Coffee",
          version: 2,
          createdBy: "user-1",
          updatedBy: "user-1",
          createdAt: "2026-03-28T10:00:00.000Z",
          updatedAt: "2026-03-28T10:00:00.000Z",
        },
      ],
    });

    const { result } = await renderHookWithProviders(() => useDeleteTransaction(), {
      ledgerSelection: { kind: "synced", householdId: "household-1" },
    });

    await act(async () => {
      await result.current.mutateAsync("transaction-1");
    });

    expect(mockEnqueueCommand).toHaveBeenCalledWith(
      db,
      expect.objectContaining({ kind: "transaction.remove" }),
    );
    expect(mockApply).not.toHaveBeenCalled();
    expect(db.delete).not.toHaveBeenCalledWith(transactions);
  });

  it("enqueues refund.link on synced and never inserts sqlite transactions", async () => {
    const db = createMockDb();
    mockUseDatabase.mockReturnValue(db);

    const { result } = await renderHookWithProviders(() => useLinkRefund(), {
      ledgerSelection: { kind: "synced", householdId: "household-1" },
    });

    await act(async () => {
      await result.current.mutateAsync({
        originalTransactionId: "transaction-1",
        depositAccountId: "account-1",
        currency: "USD",
        amountMinor: 10_00,
        date: "2026-03-29",
      });
    });

    expect(mockEnqueueCommand).toHaveBeenCalledWith(
      db,
      expect.objectContaining({ kind: "refund.link" }),
    );
    expect(mockApply).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalledWith(transactions);
  });

  it("rejects unsupported synced Transaction field updates", async () => {
    const db = createMockDb();
    mockUseDatabase.mockReturnValue(db);
    mockReadSnapshot.mockResolvedValue({
      householdId: "household-1",
      userId: "test-user",
      accounts: [],
      categories: [],
      transactions: [
        {
          householdId: "household-1",
          id: "transaction-1",
          type: "expense",
          amountMinor: 40_00,
          currency: "USD",
          originalAmountMinor: null,
          originalCurrency: null,
          exchangeRate: null,
          date: "2026-03-28",
          accountId: "account-1",
          toAccountId: null,
          categoryId: "category-1",
          isRecurring: false,
          recurringRuleId: null,
          description: "Coffee",
          version: 1,
          createdBy: "user-1",
          updatedBy: "user-1",
          createdAt: "2026-03-28T10:00:00.000Z",
          updatedAt: "2026-03-28T10:00:00.000Z",
        },
      ],
    });

    const { result } = await renderHookWithProviders(() => useUpdateTransaction(), {
      ledgerSelection: { kind: "synced", householdId: "household-1" },
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync({
          id: "transaction-1",
          data: { currency: "EUR" },
        });
      }),
    ).rejects.toThrow("unavailable for the synced ledger");
    expect(mockEnqueueCommand).not.toHaveBeenCalled();
    expect(db.update).not.toHaveBeenCalledWith(transactions);
  });
});

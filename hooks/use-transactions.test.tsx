import { act, waitFor } from "@testing-library/react-native";

import { transactions } from "@/db/schema";
import {
  useCreateTransaction,
  useDeleteTransaction,
  useMonthSummary,
  useTransaction,
  useTransactionDateRange,
  useTransactions,
  useUpdateTransaction,
} from "@/hooks/use-transactions";
import { createTransaction, createTransactionWithDetails } from "@/tests/test-utils/factories";
import { createMockDb } from "@/tests/test-utils/mock-db";
import { renderHookWithProviders } from "@/tests/test-utils/render";

const mockUseDatabase = jest.fn();

jest.mock("@/db/client", () => ({
  useDatabase: () => mockUseDatabase(),
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

describe("use-transactions hooks", () => {
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
              recurringPaymentId: null,
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
            recurringPaymentId: null,
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
      selectResults: [{ get: { minDate: "2026-01-01", maxDate: "2026-03-28" } }],
    });
    mockUseDatabase.mockReturnValue(db);

    const { result } = await renderHookWithProviders(() => useTransactionDateRange());

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({ minDate: "2026-01-01", maxDate: "2026-03-28" });
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

  it("creates transactions and invalidates dependent queries", async () => {
    const db = createMockDb();
    mockUseDatabase.mockReturnValue(db);

    const { result, client } = await renderHookWithProviders(() => useCreateTransaction());
    const invalidateQueries = jest.spyOn(client, "invalidateQueries");

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
        isRecurring: true,
        recurringPaymentId: null,
      });
    });

    expect(db.insert).toHaveBeenCalledWith(transactions);
    expect(db.__builders.insert.values).toHaveBeenCalledWith(
      expect.objectContaining({ isRecurring: true }),
    );
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["transactions"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["account-balances"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["month-summary"] });
  });

  it("updates transactions and invalidates detail queries", async () => {
    const db = createMockDb();
    mockUseDatabase.mockReturnValue(db);

    const { result, client } = await renderHookWithProviders(() => useUpdateTransaction());
    const invalidateQueries = jest.spyOn(client, "invalidateQueries");

    await act(async () => {
      await result.current.mutateAsync({
        id: "transaction-1",
        data: { description: "Dinner" },
      });
    });

    expect(db.update).toHaveBeenCalledWith(transactions);
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["transactions", "transaction-1"] });
  });

  it("deletes transactions and invalidates dependent queries", async () => {
    const db = createMockDb();
    mockUseDatabase.mockReturnValue(db);

    const { result, client } = await renderHookWithProviders(() => useDeleteTransaction());
    const invalidateQueries = jest.spyOn(client, "invalidateQueries");

    await act(async () => {
      await result.current.mutateAsync("transaction-1");
    });

    expect(db.delete).toHaveBeenCalledWith(transactions);
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["transactions"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["account-balances"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["month-summary"] });
  });
});

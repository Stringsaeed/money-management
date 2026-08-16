import { renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { recurringPayments, transactions } from "@/db/schema";
import { useRecurringProcessor } from "@/hooks/use-recurring-processor";
import { createRecurringPayment } from "@/tests/test-utils/factories";
import { createMockDb } from "@/tests/test-utils/mock-db";

const mockUseDatabase = jest.fn();

jest.mock("@/db/client", () => ({
  useDatabase: () => mockUseDatabase(),
}));

jest.mock("@/utils/date", () => ({
  ...jest.requireActual("@/utils/date"),
  nowIso: jest.fn(() => "2026-03-28T12:00:00.000Z"),
  today: jest.fn(() => "2026-03-28"),
}));

jest.mock("@/utils/id", () => ({
  generateId: jest.fn(() => "generated-transaction-id"),
}));

describe("useRecurringProcessor", () => {
  const createWrapper = (client: QueryClient) =>
    function Wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    };

  it("generates pending transactions and invalidates dependent queries", async () => {
    const db = createMockDb({
      selectResults: [
        {
          all: [
            createRecurringPayment({
              id: "recurring-1",
              interval: "daily",
              startDate: "2026-03-27",
              lastGeneratedDate: "2026-03-26",
            }),
          ],
        },
      ],
    });
    mockUseDatabase.mockReturnValue(db);

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidateQueries = jest.spyOn(client, "invalidateQueries");

    await renderHook(() => useRecurringProcessor(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => {
      expect(db.insert).toHaveBeenCalledWith(transactions);
    });

    expect(db.__builders.insert.values).toHaveBeenNthCalledWith(1, {
      id: "generated-transaction-id",
      type: "expense",
      amount: 1200_00,
      currency: "USD",
      originalAmount: null,
      originalCurrency: null,
      exchangeRate: null,
      date: "2026-03-27",
      accountId: "account-1",
      toAccountId: null,
      categoryId: "category-1",
      isRecurring: true,
      recurringPaymentId: "recurring-1",
      description: "Monthly rent",
      createdAt: "2026-03-28T12:00:00.000Z",
      updatedAt: "2026-03-28T12:00:00.000Z",
    });
    expect(db.__builders.insert.values).toHaveBeenNthCalledWith(2, {
      id: "generated-transaction-id",
      type: "expense",
      amount: 1200_00,
      currency: "USD",
      originalAmount: null,
      originalCurrency: null,
      exchangeRate: null,
      date: "2026-03-28",
      accountId: "account-1",
      toAccountId: null,
      categoryId: "category-1",
      isRecurring: true,
      recurringPaymentId: "recurring-1",
      description: "Monthly rent",
      createdAt: "2026-03-28T12:00:00.000Z",
      updatedAt: "2026-03-28T12:00:00.000Z",
    });
    expect(db.update).toHaveBeenCalledWith(recurringPayments);
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["transactions"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["account-balances"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["month-summary"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["recurring-payments"] });
  });

  it("fails silently when processing throws", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    mockUseDatabase.mockReturnValue({
      select: jest.fn(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        all: jest.fn().mockRejectedValue(new Error("boom")),
      })),
    });

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    await renderHook(() => useRecurringProcessor(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => {
      expect(warn).toHaveBeenCalled();
    });
  });
});

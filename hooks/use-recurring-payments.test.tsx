import { act, waitFor } from "@testing-library/react-native";

import { recurringPayments } from "@/db/schema";
import {
  useCreateRecurringPayment,
  useDeleteRecurringPayment,
  useRecurringPayment,
  useRecurringPayments,
  useUpdateRecurringPayment,
} from "@/hooks/use-recurring-payments";
import { createMockDb } from "@/tests/test-utils/mock-db";
import { createRecurringPayment } from "@/tests/test-utils/factories";
import { renderHookWithProviders } from "@/tests/test-utils/render";

const mockUseDatabase = jest.fn();

jest.mock("@/db/client", () => ({
  useDatabase: () => mockUseDatabase(),
}));

jest.mock("@/utils/id", () => ({
  generateId: jest.fn(() => "generated-recurring-id"),
}));

jest.mock("@/utils/date", () => ({
  nowIso: jest.fn(() => "2026-03-28T12:00:00.000Z"),
}));

describe("use-recurring-payments hooks", () => {
  it("loads recurring payments", async () => {
    const db = createMockDb({
      selectResults: [{ all: [createRecurringPayment({ id: "recurring-1" })] }],
    });
    mockUseDatabase.mockReturnValue(db);

    const { result } = await renderHookWithProviders(() => useRecurringPayments());

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([createRecurringPayment({ id: "recurring-1" })]);
  });

  it("loads a recurring payment detail", async () => {
    const db = createMockDb({
      selectResults: [{ get: createRecurringPayment({ id: "recurring-1", name: "Gym" }) }],
    });
    mockUseDatabase.mockReturnValue(db);

    const { result } = await renderHookWithProviders(() => useRecurringPayment("recurring-1"));

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(createRecurringPayment({ id: "recurring-1", name: "Gym" }));
  });

  it("creates recurring payments and invalidates the list", async () => {
    const db = createMockDb();
    mockUseDatabase.mockReturnValue(db);

    const { result, client } = await renderHookWithProviders(() => useCreateRecurringPayment());
    const invalidateQueries = jest.spyOn(client, "invalidateQueries");

    await act(async () => {
      await result.current.mutateAsync({
        name: "Rent",
        type: "expense",
        amount: 1200_00,
        currency: "USD",
        accountId: "account-1",
        toAccountId: null,
        categoryId: "category-1",
        description: "Monthly rent",
        interval: "monthly",
        dayOfMonth: 1,
        dayOfWeek: null,
        monthOfYear: null,
        startDate: "2026-01-01",
        endDate: null,
        lastGeneratedDate: null,
        isActive: true,
      });
    });

    expect(db.insert).toHaveBeenCalledWith(recurringPayments);
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["recurring-payments"] });
  });

  it("updates recurring payments and invalidates detail queries", async () => {
    const db = createMockDb();
    mockUseDatabase.mockReturnValue(db);

    const { result, client } = await renderHookWithProviders(() => useUpdateRecurringPayment());
    const invalidateQueries = jest.spyOn(client, "invalidateQueries");

    await act(async () => {
      await result.current.mutateAsync({
        id: "recurring-1",
        data: { name: "Updated rent" },
      });
    });

    expect(db.update).toHaveBeenCalledWith(recurringPayments);
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["recurring-payments", "recurring-1"],
    });
  });

  it("deletes recurring payments and invalidates the list", async () => {
    const db = createMockDb();
    mockUseDatabase.mockReturnValue(db);

    const { result, client } = await renderHookWithProviders(() => useDeleteRecurringPayment());
    const invalidateQueries = jest.spyOn(client, "invalidateQueries");

    await act(async () => {
      await result.current.mutateAsync("recurring-1");
    });

    expect(db.delete).toHaveBeenCalledWith(recurringPayments);
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["recurring-payments"] });
  });
});

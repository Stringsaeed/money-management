import { act, waitFor } from "@testing-library/react-native";

import { accounts, transactions } from "@/db/schema";
import {
  useAccount,
  useAccounts,
  useAccountsWithBalances,
  useCreateAccount,
  useDeleteAccount,
  useUpdateAccount,
} from "@/hooks/use-accounts";
import { createAccount, createAccountWithBalance } from "@/tests/test-utils/factories";
import { createMockDb } from "@/tests/test-utils/mock-db";
import { renderHookWithProviders } from "@/tests/test-utils/render";

const mockUseDatabase = jest.fn();

jest.mock("@/db/client", () => ({
  useDatabase: () => mockUseDatabase(),
}));

jest.mock("@/utils/id", () => ({
  generateId: jest.fn(() => "generated-account-id"),
}));

jest.mock("@/utils/date", () => ({
  nowIso: jest.fn(() => "2026-03-28T12:00:00.000Z"),
}));

describe("use-accounts hooks", () => {
  it("loads sorted accounts", async () => {
    const db = createMockDb({
      selectResults: [
        { all: [createAccount({ id: "account-1" }), createAccount({ id: "account-2" })] },
      ],
    });
    mockUseDatabase.mockReturnValue(db);

    const { result } = renderHookWithProviders(() => useAccounts());

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(db.select).toHaveBeenCalled();
    expect(result.current.data).toEqual([
      createAccount({ id: "account-1" }),
      createAccount({ id: "account-2" }),
    ]);
  });

  it("loads a single account by id", async () => {
    const db = createMockDb({
      selectResults: [{ get: createAccount({ id: "account-1", name: "Travel Fund" }) }],
    });
    mockUseDatabase.mockReturnValue(db);

    const { result } = renderHookWithProviders(() => useAccount("account-1"));

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(createAccount({ id: "account-1", name: "Travel Fund" }));
  });

  it("computes account balances from account and balance rows", async () => {
    const db = createMockDb({
      selectResults: [
        {
          all: [
            createAccount({ id: "account-1", initialBalance: 100_00 }),
            createAccount({ id: "account-2", initialBalance: 25_00 }),
          ],
        },
        {
          all: [
            { accountId: "account-1", balance: 150_00 },
            { accountId: "account-2", balance: 40_00 },
          ],
        },
      ],
    });
    mockUseDatabase.mockReturnValue(db);

    const { result } = renderHookWithProviders(() => useAccountsWithBalances());

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([
      createAccountWithBalance({ id: "account-1", initialBalance: 100_00, balance: 150_00 }),
      createAccountWithBalance({ id: "account-2", initialBalance: 25_00, balance: 40_00 }),
    ]);
  });

  it("creates an account and invalidates account queries", async () => {
    const db = createMockDb();
    mockUseDatabase.mockReturnValue(db);

    const { result, client } = renderHookWithProviders(() => useCreateAccount());
    const invalidateQueries = jest.spyOn(client, "invalidateQueries");

    await act(async () => {
      await result.current.mutateAsync({
        name: "Travel",
        type: "savings",
        currency: "USD",
        color: "#8B9D83",
        icon: "banknote.fill",
        initialBalance: 0,
        excludeFromTotal: false,
        sortOrder: 0,
      });
    });

    expect(db.insert).toHaveBeenCalledWith(accounts);
    expect(db.__builders.insert.values).toHaveBeenCalledWith({
      id: "generated-account-id",
      name: "Travel",
      type: "savings",
      currency: "USD",
      color: "#8B9D83",
      icon: "banknote.fill",
      initialBalance: 0,
      excludeFromTotal: false,
      sortOrder: 0,
      createdAt: "2026-03-28T12:00:00.000Z",
      updatedAt: "2026-03-28T12:00:00.000Z",
    });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["accounts"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["account-balances"] });
  });

  it("updates an account and invalidates detail queries", async () => {
    const db = createMockDb();
    mockUseDatabase.mockReturnValue(db);

    const { result, client } = renderHookWithProviders(() => useUpdateAccount());
    const invalidateQueries = jest.spyOn(client, "invalidateQueries");

    await act(async () => {
      await result.current.mutateAsync({
        id: "account-1",
        data: { name: "Updated Name" },
      });
    });

    expect(db.update).toHaveBeenCalledWith(accounts);
    expect(db.__builders.update.set).toHaveBeenCalledWith({
      name: "Updated Name",
      updatedAt: "2026-03-28T12:00:00.000Z",
    });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["accounts", "account-1"] });
  });

  it("deletes an account and invalidates balance queries", async () => {
    const db = createMockDb();
    mockUseDatabase.mockReturnValue(db);

    const { result, client } = renderHookWithProviders(() => useDeleteAccount());
    const invalidateQueries = jest.spyOn(client, "invalidateQueries");

    await act(async () => {
      await result.current.mutateAsync("account-1");
    });

    expect(db.delete).toHaveBeenCalledWith(accounts);
    expect(db.__builders.delete.where).toHaveBeenCalled();
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["account-balances"] });
    expect(transactions).toBeDefined();
  });
});

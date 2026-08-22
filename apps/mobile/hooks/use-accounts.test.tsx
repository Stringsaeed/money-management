import { act, waitFor } from "@testing-library/react-native";

import { accounts } from "@/db/schema";
import {
  useAccount,
  useAccounts,
  useAccountsWithBalances,
  useCreateAccount,
  useDeleteAccount,
  usePreviewAccountDeletion,
  useUpdateAccount,
} from "@/hooks/use-accounts";
import { createAccount, createAccountWithBalance } from "@/tests/test-utils/factories";
import { createMockDb } from "@/tests/test-utils/mock-db";
import { renderHookWithProviders } from "@/tests/test-utils/render";

const mockUseDatabase = jest.fn();
const mockUseSQLiteContext = jest.fn();
const mockDeleteAccountWithRecurringRules = jest.fn();
const mockPreviewAccountDeletion = jest.fn();
const mockUpdateAccountWithRecurringRules = jest.fn();
const mockCohereLedgerCache = jest.fn();

interface CoherenceAwareMutation<T> {
  expectPending: () => void;
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
    expectPending: () => {
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

jest.mock("@/db/client", () => ({
  useDatabase: () => mockUseDatabase(),
}));

jest.mock("expo-sqlite", () => ({
  useSQLiteContext: () => mockUseSQLiteContext(),
}));

jest.mock("@/modules/account-recurring-coordinator", () => ({
  deleteAccountWithRecurringRules: (...args: unknown[]) =>
    mockDeleteAccountWithRecurringRules(...args),
  previewAccountDeletion: (...args: unknown[]) => mockPreviewAccountDeletion(...args),
  updateAccountWithRecurringRules: (...args: unknown[]) =>
    mockUpdateAccountWithRecurringRules(...args),
}));

jest.mock("@/modules/ledger-cache", () => ({
  ...jest.requireActual("@/modules/ledger-cache"),
  cohereLedgerCache: (...args: unknown[]) => mockCohereLedgerCache(...args),
}));

jest.mock("@/utils/id", () => ({
  generateId: jest.fn(() => "generated-account-id"),
}));

jest.mock("@/utils/date", () => ({
  nowIso: jest.fn(() => "2026-03-28T12:00:00.000Z"),
}));

describe("use-accounts hooks", () => {
  beforeEach(() => {
    mockUseSQLiteContext.mockReturnValue({ raw: "database" });
    mockDeleteAccountWithRecurringRules.mockResolvedValue({ accountId: "account-1", rules: [] });
    mockPreviewAccountDeletion.mockResolvedValue({ accountId: "account-1", rules: [] });
    mockUpdateAccountWithRecurringRules.mockResolvedValue({
      accountId: "account-1",
      rulesNeedingAttention: [],
    });
    mockCohereLedgerCache.mockResolvedValue(undefined);
  });

  it("loads sorted accounts", async () => {
    const db = createMockDb({
      selectResults: [
        { all: [createAccount({ id: "account-1" }), createAccount({ id: "account-2" })] },
      ],
    });
    mockUseDatabase.mockReturnValue(db);

    const { result } = await renderHookWithProviders(() => useAccounts());

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

    const { result } = await renderHookWithProviders(() => useAccount("account-1"));

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

    const { result } = await renderHookWithProviders(() => useAccountsWithBalances());

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([
      createAccountWithBalance({ id: "account-1", initialBalance: 100_00, balance: 150_00 }),
      createAccountWithBalance({ id: "account-2", initialBalance: 25_00, balance: 40_00 }),
    ]);
  });

  it("reports an Account creation and waits for cache coherence", async () => {
    const db = createMockDb();
    mockUseDatabase.mockReturnValue(db);

    const { result, client } = await renderHookWithProviders(() => useCreateAccount());
    const mutation = await startMutationAwaitingCoherence(() =>
      result.current.mutateAsync({
        name: "Travel",
        type: "savings",
        currency: "USD",
        color: "#8B9D83",
        icon: "banknote.fill",
        initialBalance: 0,
        excludeFromTotal: false,
        sortOrder: 0,
      }),
    );

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
    await waitFor(() => {
      expect(mockCohereLedgerCache).toHaveBeenCalledWith(client, {
        kind: "account.created",
        id: "generated-account-id",
      });
    });
    mutation.expectPending();
    await expect(mutation.resolve()).resolves.toBe("generated-account-id");
  });

  it("reports an Account update after the coordinated write commits", async () => {
    const db = createMockDb();
    mockUseDatabase.mockReturnValue(db);

    const { result, client } = await renderHookWithProviders(() => useUpdateAccount());
    const mutation = await startMutationAwaitingCoherence(() =>
      result.current.mutateAsync({
        id: "account-1",
        data: { name: "Updated Name" },
      }),
    );

    expect(mockUpdateAccountWithRecurringRules).toHaveBeenCalledWith(
      { raw: "database" },
      {
        accountId: "account-1",
        changes: { name: "Updated Name" },
        now: "2026-03-28T12:00:00.000Z",
      },
    );
    await waitFor(() => {
      expect(mockCohereLedgerCache).toHaveBeenCalledWith(client, {
        kind: "account.updated",
        id: "account-1",
      });
    });
    mutation.expectPending();
    await mutation.resolve();
  });

  it("previews affected Recurring Rules before Account deletion", async () => {
    const { result } = await renderHookWithProviders(() => usePreviewAccountDeletion());

    await act(async () => {
      await result.current.mutateAsync("account-1");
    });

    expect(mockPreviewAccountDeletion).toHaveBeenCalledWith({ raw: "database" }, "account-1");
  });

  it("reports coordinated Account deletion after Recurring Rules have been updated", async () => {
    const { result, client } = await renderHookWithProviders(() => useDeleteAccount());
    const mutation = await startMutationAwaitingCoherence(() =>
      result.current.mutateAsync("account-1"),
    );

    expect(mockDeleteAccountWithRecurringRules).toHaveBeenCalledWith(
      { raw: "database" },
      { accountId: "account-1", now: "2026-03-28T12:00:00.000Z" },
    );
    await waitFor(() => {
      expect(mockCohereLedgerCache).toHaveBeenCalledWith(client, {
        kind: "account.deleted",
        id: "account-1",
      });
    });
    mutation.expectPending();
    await mutation.resolve();
  });
});

import { act, waitFor } from "@testing-library/react-native";

import { accounts } from "@/db/schema";
import {
  useAccount,
  useAccountArchivalPreview,
  useAccountDeletionPreview,
  useAccounts,
  useAccountsWithBalances,
  useArchiveAccount,
  useCreateAccount,
  useDeleteAccount,
  useRestoreAccount,
  useUpdateAccount,
} from "@/hooks/use-accounts";
import { createAccount, createAccountWithBalance } from "@/tests/test-utils/factories";
import { createMockDb } from "@/tests/test-utils/mock-db";
import { renderHookWithProviders } from "@/tests/test-utils/render";

const mockUseDatabase = jest.fn();
const mockUseSQLiteContext = jest.fn();
const mockArchiveAccount = jest.fn();
const mockDeleteAccount = jest.fn();
const mockLoadAccountBalances = jest.fn();
const mockPreviewAccountArchival = jest.fn();
const mockPreviewAccountDeletion = jest.fn();
const mockRestoreAccount = jest.fn();
const mockUpdateAccountWithRecurringRules = jest.fn();
const mockCohereLedgerCache = jest.fn();
const mockUseAccountVisibility = jest.fn();

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

jest.mock("@/hooks/use-account-visibility", () => ({
  hasVisibleAccount: (
    visibility: { isFiltering: boolean; visibleAccountIds: Set<string> },
    id: string,
  ) => !visibility.isFiltering || visibility.visibleAccountIds.has(id),
  useAccountVisibility: () => mockUseAccountVisibility(),
}));

jest.mock("@/db/sqlite", () => ({
  useSQLiteContext: () => mockUseSQLiteContext(),
}));

jest.mock("@/modules/account-recurring-coordinator", () => ({
  updateAccountWithRecurringRules: (...args: unknown[]) =>
    mockUpdateAccountWithRecurringRules(...args),
}));

jest.mock("@/modules/accounts/account-lifecycle", () => ({
  archiveAccount: (...args: unknown[]) => mockArchiveAccount(...args),
  deleteAccount: (...args: unknown[]) => mockDeleteAccount(...args),
  previewAccountArchival: (...args: unknown[]) => mockPreviewAccountArchival(...args),
  previewAccountDeletion: (...args: unknown[]) => mockPreviewAccountDeletion(...args),
  restoreAccount: (...args: unknown[]) => mockRestoreAccount(...args),
}));

jest.mock("@/modules/accounts/account-balance", () => ({
  loadAccountBalances: (...args: unknown[]) => mockLoadAccountBalances(...args),
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
  toDateString: jest.fn(() => "2026-03-28"),
}));

describe("use-accounts hooks", () => {
  beforeEach(() => {
    mockUseAccountVisibility.mockReturnValue({
      cacheKey: "local-only",
      isFiltering: false,
      visibleAccountIds: new Set(),
    });
    mockUseSQLiteContext.mockReturnValue({ raw: "database" });
    mockArchiveAccount.mockResolvedValue(undefined);
    mockDeleteAccount.mockResolvedValue(undefined);
    mockLoadAccountBalances.mockResolvedValue([]);
    mockPreviewAccountArchival.mockResolvedValue({
      accountId: "account-1",
      blockers: [],
      canArchive: true,
    });
    mockPreviewAccountDeletion.mockResolvedValue({
      accountId: "account-1",
      transactionCount: 0,
      recurringRuleCount: 0,
      fundingMembershipCount: 0,
      canDelete: true,
    });
    mockRestoreAccount.mockResolvedValue(undefined);
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
    expect(result.current.source).toBe("local");
    expect(result.current.offlineState).toEqual({ kind: "offline_ready" });
    expect(result.current.data).toEqual([
      createAccount({ id: "account-1" }),
      createAccount({ id: "account-2" }),
    ]);
  });

  it("hides locally retained accounts that the server no longer authorizes", async () => {
    mockUseAccountVisibility.mockReturnValue({
      cacheKey: "household-1:shared-account",
      isFiltering: true,
      visibleAccountIds: new Set(["shared-account"]),
    });
    const db = createMockDb({
      selectResults: [
        {
          all: [createAccount({ id: "shared-account" }), createAccount({ id: "private-account" })],
        },
      ],
    });
    mockUseDatabase.mockReturnValue(db);

    const { result } = await renderHookWithProviders(() => useAccounts());

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.data).toEqual([createAccount({ id: "shared-account" })]);
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
    mockLoadAccountBalances.mockResolvedValue([
      createAccountWithBalance({ id: "account-1", initialBalance: 100_00, balance: 150_00 }),
      createAccountWithBalance({ id: "account-2", initialBalance: 25_00, balance: 40_00 }),
    ]);

    const { result } = await renderHookWithProviders(() => useAccountsWithBalances());

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([
      createAccountWithBalance({ id: "account-1", initialBalance: 100_00, balance: 150_00 }),
      createAccountWithBalance({ id: "account-2", initialBalance: 25_00, balance: 40_00 }),
    ]);
    expect(mockLoadAccountBalances).toHaveBeenCalledWith({ raw: "database" }, false);
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
      lifecycle: "active",
      lifecycleChangedAt: null,
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

  it("loads complete archival and deletion prerequisites", async () => {
    const archival = await renderHookWithProviders(() => useAccountArchivalPreview("account-1"));
    const deletion = await renderHookWithProviders(() => useAccountDeletionPreview("account-1"));

    await waitFor(() => expect(archival.result.current.isSuccess).toBe(true));
    await waitFor(() => expect(deletion.result.current.isSuccess).toBe(true));

    expect(mockPreviewAccountArchival).toHaveBeenCalledWith(
      { raw: "database" },
      "account-1",
      "2026-03-28",
    );
    expect(mockPreviewAccountDeletion).toHaveBeenCalledWith({ raw: "database" }, "account-1");
  });

  it("reports Account archival after its atomic lifecycle write commits", async () => {
    const { result, client } = await renderHookWithProviders(() => useArchiveAccount());
    const mutation = await startMutationAwaitingCoherence(() =>
      result.current.mutateAsync("account-1"),
    );

    expect(mockArchiveAccount).toHaveBeenCalledWith(
      { raw: "database" },
      {
        accountId: "account-1",
        localDate: "2026-03-28",
        now: "2026-03-28T12:00:00.000Z",
      },
    );
    await waitFor(() => {
      expect(mockCohereLedgerCache).toHaveBeenCalledWith(client, {
        kind: "account.archived",
        id: "account-1",
      });
    });
    mutation.expectPending();
    await mutation.resolve();
  });

  it("reports Account restoration without restoring Funding Membership", async () => {
    const { result, client } = await renderHookWithProviders(() => useRestoreAccount());
    const mutation = await startMutationAwaitingCoherence(() =>
      result.current.mutateAsync("account-1"),
    );

    expect(mockRestoreAccount).toHaveBeenCalledWith(
      { raw: "database" },
      { accountId: "account-1", now: "2026-03-28T12:00:00.000Z" },
    );
    await waitFor(() => {
      expect(mockCohereLedgerCache).toHaveBeenCalledWith(client, {
        kind: "account.restored",
        id: "account-1",
      });
    });
    mutation.expectPending();
    await mutation.resolve();
  });

  it("reports permanent deletion only after the guarded domain write commits", async () => {
    const { result, client } = await renderHookWithProviders(() => useDeleteAccount());
    const mutation = await startMutationAwaitingCoherence(() =>
      result.current.mutateAsync("account-1"),
    );

    expect(mockDeleteAccount).toHaveBeenCalledWith({ raw: "database" }, "account-1");
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

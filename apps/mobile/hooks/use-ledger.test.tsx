import { waitFor } from "@testing-library/react-native";

import { useLedger, useLedgerTransactions } from "@/hooks/use-ledger";
import { createMockDb } from "@/tests/test-utils/mock-db";
import { renderHookWithProviders as renderBaseHook } from "@/tests/test-utils/render";

const mockListAccounts = jest.fn();
const mockListCategories = jest.fn();
const mockListTransactions = jest.fn();
const mockGetDelta = jest.fn();
const mockApplyCommand = jest.fn();
const mockUseDatabase = jest.fn();
const mockUseSQLiteContext = jest.fn();

jest.mock("@/db/client", () => ({
  useDatabase: () => mockUseDatabase(),
}));

jest.mock("expo-sqlite", () => ({
  useSQLiteContext: () => mockUseSQLiteContext(),
}));

jest.mock("@/hooks/use-account-visibility", () => ({
  hasVisibleAccount: () => true,
  useAccountVisibility: () => ({
    cacheKey: "local-only",
    isFiltering: false,
    visibleAccountIds: new Set(),
  }),
}));

jest.mock("@/lib/server/orpc", () => ({
  orpc: {
    ledger: {
      accounts: { list: (...args: unknown[]) => mockListAccounts(...args) },
      categories: { list: (...args: unknown[]) => mockListCategories(...args) },
      transactions: { list: (...args: unknown[]) => mockListTransactions(...args) },
    },
    sync: { getDelta: (...args: unknown[]) => mockGetDelta(...args) },
    commands: { apply: (...args: unknown[]) => mockApplyCommand(...args) },
  },
}));

jest.mock("@/lib/auth-client", () => ({
  authClient: { useSession: () => ({ data: { user: { id: "user-1" } }, isPending: false }) },
}));

const HOUSEHOLD_ID = "household-1";

const renderHookWithProviders = <TProps, TResult>(
  hook: (props: TProps) => TResult,
  options: Parameters<typeof renderBaseHook<TProps, TResult>>[1] = {},
) =>
  renderBaseHook(hook, {
    ...options,
    ledgerSelection: { kind: "synced", householdId: HOUSEHOLD_ID },
  });

const ACCOUNTS = [
  {
    id: "acc-1",
    householdId: HOUSEHOLD_ID,
    name: "Checking",
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
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  },
];
const CATEGORIES = [
  {
    id: "cat-1",
    householdId: HOUSEHOLD_ID,
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
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  },
];

describe("useLedger", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDatabase.mockReturnValue(createMockDb());
    mockUseSQLiteContext.mockReturnValue({ getAllAsync: jest.fn().mockResolvedValue([]) });
    mockListAccounts.mockResolvedValue(ACCOUNTS);
    mockListCategories.mockResolvedValue(CATEGORIES);
    mockListTransactions.mockResolvedValue({
      transactions: [
        {
          householdId: HOUSEHOLD_ID,
          id: "tx-1",
          type: "expense",
          amountMinor: 2500,
          currency: "USD",
          originalAmountMinor: null,
          originalCurrency: null,
          exchangeRate: null,
          date: "2026-01-15",
          accountId: "acc-1",
          toAccountId: null,
          categoryId: "cat-1",
          isRecurring: false,
          recurringRuleId: null,
          description: "Groceries",
          version: 0,
          createdBy: "user-1",
          updatedBy: "user-1",
          createdAt: new Date("2026-01-15T00:00:00.000Z"),
          updatedAt: new Date("2026-01-15T00:00:00.000Z"),
        },
      ],
      hasMore: false,
    });
    mockGetDelta.mockResolvedValue({ seq: 4, changes: [], hasMore: false });
    mockApplyCommand.mockResolvedValue({
      kind: "applied",
      seq: 5,
      effects: ["ledger"],
      applied: {},
      replayed: false,
    });
  });

  it("fetches all three lists for the household", async () => {
    const { result } = await renderHookWithProviders(() => useLedger(HOUSEHOLD_ID));

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    expect(mockListAccounts).toHaveBeenCalledWith({ householdId: HOUSEHOLD_ID });
    expect(mockListCategories).toHaveBeenCalledWith({ householdId: HOUSEHOLD_ID });
    expect(mockListTransactions).toHaveBeenCalledWith({ householdId: HOUSEHOLD_ID, limit: 200 });
    expect(result.current.accounts).toHaveLength(1);
    expect(result.current.categories).toHaveLength(1);
    expect(result.current.transactions).toHaveLength(1);
    expect(result.current.hasMoreTransactions).toBe(false);
    expect(result.current.offlineState).toEqual({ kind: "online" });
  });

  it("hydrates and writes back through the explicit synced source", async () => {
    const { result } = await renderHookWithProviders(() => useLedger(HOUSEHOLD_ID));

    await waitFor(() => expect(result.current.isPending).toBe(false));

    await expect(result.current.hydrate({ since: 3 })).resolves.toMatchObject({ seq: 4 });
    await expect(
      result.current.writeback({
        commandId: "command-1",
        householdId: HOUSEHOLD_ID,
        kind: "transaction.remove",
        payload: { transactionId: "tx-1" },
      }),
    ).resolves.toMatchObject({ kind: "applied", seq: 5 });

    expect(mockGetDelta).toHaveBeenCalledWith({ householdId: HOUSEHOLD_ID, since: 3 });
    expect(mockApplyCommand).toHaveBeenCalledWith({
      commandId: "command-1",
      householdId: HOUSEHOLD_ID,
      kind: "transaction.remove",
      payload: { transactionId: "tx-1" },
    });
  });

  it("rejects writeback addressed to a different household", async () => {
    const { result } = await renderHookWithProviders(() => useLedger(HOUSEHOLD_ID));

    await waitFor(() => expect(result.current.isPending).toBe(false));

    await expect(
      result.current.writeback({
        commandId: "command-wrong-household",
        householdId: "household-2",
        kind: "transaction.remove",
        payload: { transactionId: "tx-1" },
      }),
    ).rejects.toMatchObject({
      name: "LedgerDataSourceError",
      source: "synced",
      operation: "writeback.submit",
    });
    expect(mockApplyCommand).not.toHaveBeenCalled();
  });

  it("surfaces synced read failures without falling back to another ledger", async () => {
    mockListAccounts.mockRejectedValueOnce(new Error("network unavailable"));

    const { result } = await renderHookWithProviders(() => useLedger(HOUSEHOLD_ID));

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.source).toBe("synced");
    expect(result.current.error).toMatchObject({
      name: "LedgerDataSourceError",
      source: "synced",
      operation: "read.accounts",
      reason: "operation_failed",
    });
  });

  it("uses provider selection when the legacy household argument is absent", async () => {
    const { result } = await renderHookWithProviders(() => useLedger(null));

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });
    expect(result.current.source).toBe("synced");
    expect(result.current.accounts).toHaveLength(1);
  });

  it("remains readable when sync effects refresh covered resource caches", async () => {
    const { result, rerender } = await renderHookWithProviders(
      ({ effects }: { effects: readonly string[] }) => useLedger(HOUSEHOLD_ID, effects),
      { initialProps: { effects: [] as readonly string[] } },
    );

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });
    // A remote member commits a transaction; the next poll carries its tags.
    rerender({ effects: ["ledger", "balances"] });

    await waitFor(() => {
      expect(result.current.transactions).toHaveLength(1);
      expect(result.current.isError).toBe(false);
    });
  });

  it("does not refetch when effects are uncovered tags", async () => {
    const { result, rerender } = await renderHookWithProviders(
      ({ effects }: { effects: readonly string[] }) => useLedger(HOUSEHOLD_ID, effects),
      { initialProps: { effects: [] as readonly string[] } },
    );

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    rerender({ effects: ["members"] });
    // Let any (uncovered-tag) refetch attempt flush; none should occur.
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(mockListAccounts.mock.calls).toHaveLength(2);
    expect(mockListCategories.mock.calls).toHaveLength(2);
    expect(mockListTransactions.mock.calls).toHaveLength(1);
  });

  it("returns a normalized page to legacy Ledger callers", async () => {
    const { result } = await renderHookWithProviders(() =>
      useLedgerTransactions(HOUSEHOLD_ID, { limit: 25, beforeDate: "2026-02-01" }),
    );
    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });
    expect(result.current.data).toMatchObject({
      transactions: [{ id: "tx-1", amount: 2500 }],
      hasMore: false,
    });
  });
});

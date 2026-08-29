import { waitFor } from "@testing-library/react-native";

import { ledgerQueriesForEffects, useLedger, useLedgerTransactions } from "@/hooks/use-ledger";
import { renderHookWithProviders } from "@/tests/test-utils/render";

const mockListAccounts = jest.fn();
const mockListCategories = jest.fn();
const mockListTransactions = jest.fn();
const mockGetDelta = jest.fn();
const mockApplyCommand = jest.fn();

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

const ACCOUNTS = [
  { id: "acc-1", householdId: HOUSEHOLD_ID, name: "Checking", type: "bank", lifecycle: "active" },
];
const CATEGORIES = [{ id: "cat-1", householdId: HOUSEHOLD_ID, name: "Groceries", type: "expense" }];

describe("ledgerQueriesForEffects", () => {
  it("maps ledger/balances onto accounts and transactions", () => {
    expect(ledgerQueriesForEffects(["balances"])).toEqual(["accounts", "transactions"]);
    expect(ledgerQueriesForEffects(["ledger"])).toEqual(["accounts", "transactions"]);
  });

  it("maps summaries onto categories only", () => {
    expect(ledgerQueriesForEffects(["summaries"])).toEqual(["categories"]);
  });

  it("ignores unrelated tags", () => {
    expect(ledgerQueriesForEffects(["members", "envelopes"])).toEqual([]);
  });
});

describe("useLedger", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListAccounts.mockResolvedValue(ACCOUNTS);
    mockListCategories.mockResolvedValue(CATEGORIES);
    mockListTransactions.mockResolvedValue({
      transactions: [{ id: "tx-1", amountMinor: 2500, date: "2026-01-15" }],
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
    expect(mockListTransactions).toHaveBeenCalledWith({ householdId: HOUSEHOLD_ID });
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
      message: "The synced ledger could not read accounts: network unavailable",
    });
  });

  it("stays idle without a household", async () => {
    const { result } = await renderHookWithProviders(() => useLedger(null));

    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });
    expect(mockListAccounts).not.toHaveBeenCalled();
  });

  it("refetches lists when sync effects touch covered tags", async () => {
    const { result, rerender } = await renderHookWithProviders(
      ({ effects }: { effects: readonly string[] }) => useLedger(HOUSEHOLD_ID, effects),
      { initialProps: { effects: [] as readonly string[] } },
    );

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });
    const before = mockListAccounts.mock.calls.length;

    // A remote member commits a transaction; the next poll carries its tags.
    rerender({ effects: ["ledger", "balances"] });

    await waitFor(() => {
      expect(mockListAccounts.mock.calls.length).toBeGreaterThan(before);
      expect(mockListTransactions.mock.calls.length).toBeGreaterThan(before);
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

    expect(mockListAccounts.mock.calls).toHaveLength(1);
    expect(mockListCategories.mock.calls).toHaveLength(1);
    expect(mockListTransactions.mock.calls).toHaveLength(1);
  });

  it("passes keyset pagination options through to the transactions query", async () => {
    const { result } = await renderHookWithProviders(() =>
      useLedgerTransactions(HOUSEHOLD_ID, { limit: 25, beforeDate: "2026-01-01" }),
    );
    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });
    expect(mockListTransactions).toHaveBeenCalledWith({
      householdId: HOUSEHOLD_ID,
      limit: 25,
      beforeDate: "2026-01-01",
    });
  });
});

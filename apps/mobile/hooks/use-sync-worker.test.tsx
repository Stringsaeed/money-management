import { AppState } from "react-native";
import { act, waitFor } from "@testing-library/react-native";

import { useSyncWorker } from "@/hooks/use-sync-worker";
import { createTestQueryClient, renderHookWithProviders } from "@/tests/test-utils/render";

const mockDrainOutbox = jest.fn();
const mockPullDeltas = jest.fn();
const mockCountPending = jest.fn();
const mockListRejected = jest.fn();
const mockDiscard = jest.fn();
const mockRetry = jest.fn();
const mockApply = jest.fn();
const mockGetDelta = jest.fn();

const FAKE_DB = { __fakeDb: true };
jest.mock("@/db/client", () => ({
  useDatabase: () => FAKE_DB,
}));

jest.mock("@/lib/sync/outbox", () => ({
  drainOutbox: (...args: unknown[]) => mockDrainOutbox(...args),
  pullDeltas: (...args: unknown[]) => mockPullDeltas(...args),
  countPendingCommands: (...args: unknown[]) => mockCountPending(...args),
  listRejectedChanges: (...args: unknown[]) => mockListRejected(...args),
  discardRejectedCommand: (...args: unknown[]) => mockDiscard(...args),
  retryRejectedCommand: (...args: unknown[]) => mockRetry(...args),
}));

jest.mock("@/lib/server/orpc", () => ({
  orpc: {
    commands: { apply: (...args: unknown[]) => mockApply(...args) },
    sync: { getDelta: (...args: unknown[]) => mockGetDelta(...args) },
  },
}));

const HOUSEHOLD_ID = "household-1";

let appStateListener: ((state: string) => void) | undefined;

function defaultMocks() {
  mockDrainOutbox.mockResolvedValue({ applied: 0, rejected: 0, pending: 0 });
  mockPullDeltas.mockResolvedValue({ seq: 0, hasMore: false, changes: [] });
  mockCountPending.mockResolvedValue(2);
  mockListRejected.mockResolvedValue([
    {
      commandId: "cmd-rej",
      householdId: HOUSEHOLD_ID,
      kind: "transaction.create",
      rejectionKind: "stale_version",
      rejectionPayload: { kind: "stale_version" },
      attempts: 1,
      createdAt: new Date(),
    },
  ]);
}

async function flushTurn() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("useSyncWorker", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    defaultMocks();
    // Stable no-op AppState listener registry for every test.
    jest.spyOn(AppState, "addEventListener").mockImplementation((_event, listener) => {
      appStateListener = listener as (state: string) => void;
      return { remove: jest.fn() };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("runs one drain+pull turn on mount and refreshes counters", async () => {
    const { result } = await await renderHookWithProviders(() => useSyncWorker(HOUSEHOLD_ID));

    // Drain and pull receive the injected db plus transports bound to oRPC.
    await waitFor(() => {
      expect(mockDrainOutbox).toHaveBeenCalledWith(FAKE_DB, expect.any(Function));
      expect(mockPullDeltas).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(Function),
        HOUSEHOLD_ID,
      );
    });

    await waitFor(() => {
      expect(result.current.pendingCount).toBe(2);
      expect(result.current.rejectedChanges).toHaveLength(1);
      expect(result.current.rejectedChanges[0].rejectionKind).toBe("stale_version");
    });
  });

  it("does nothing without a household", async () => {
    await renderHookWithProviders(() => useSyncWorker(null));

    await flushTurn();
    expect(mockDrainOutbox).not.toHaveBeenCalled();
    expect(mockPullDeltas).not.toHaveBeenCalled();
  });

  it("drains via orpc.commands.apply and pulls via sync.getDelta", async () => {
    await renderHookWithProviders(() => useSyncWorker(HOUSEHOLD_ID));
    await waitFor(() => {
      expect(mockDrainOutbox).toHaveBeenCalled();
    });

    const drainSend = mockDrainOutbox.mock.calls[0][1] as (envelope: unknown) => Promise<unknown>;
    mockApply.mockResolvedValue({
      kind: "applied",
      seq: 1,
      effects: [],
      applied: {},
      replayed: false,
    });
    await drainSend({ commandId: "c1" });
    expect(mockApply).toHaveBeenCalledWith({ commandId: "c1" });

    const fetchDelta = mockPullDeltas.mock.calls[0][1] as (args: unknown) => Promise<unknown>;
    mockGetDelta.mockResolvedValue({ seq: 3, hasMore: false, changes: [] });
    await fetchDelta({ householdId: HOUSEHOLD_ID, since: 1 });
    expect(mockGetDelta).toHaveBeenCalledWith({ householdId: HOUSEHOLD_ID, since: 1 });
  });

  it("registers the interval poller at the convergence cadence", async () => {
    const setIntervalSpy = jest.spyOn(global, "setInterval");
    await renderHookWithProviders(() => useSyncWorker(HOUSEHOLD_ID));

    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 30_000);
    setIntervalSpy.mockRestore();
  });

  it("runs a new turn when the app returns to the foreground", async () => {
    await renderHookWithProviders(() => useSyncWorker(HOUSEHOLD_ID));
    await waitFor(() => {
      expect(mockDrainOutbox).toHaveBeenCalledTimes(1);
    });
    expect(appStateListener).toBeDefined();

    await act(async () => {
      appStateListener!("active");
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(mockDrainOutbox).toHaveBeenCalledTimes(2);
    });
  });

  it("invalidates the covered ledger queries for delta effect tags (cache coherence)", async () => {
    mockPullDeltas.mockResolvedValue({
      seq: 4,
      hasMore: false,
      changes: [{ seq: 3, effects: ["ledger", "summaries"] }],
    });
    const client = createTestQueryClient();
    const invalidateSpy = jest.spyOn(client, "invalidateQueries");

    await renderHookWithProviders(() => useSyncWorker(HOUSEHOLD_ID), { client });
    await flushTurn();

    // accounts + transactions (from "ledger") and categories (from "summaries").
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["ledger", "accounts", HOUSEHOLD_ID] });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["ledger", "transactions", HOUSEHOLD_ID],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["ledger", "categories", HOUSEHOLD_ID],
    });
  });

  it("discard/retry delegate to the outbox core and retry re-drains immediately", async () => {
    const { result } = await await renderHookWithProviders(() => useSyncWorker(HOUSEHOLD_ID));
    await waitFor(() => {
      expect(result.current.rejectedChanges).toHaveLength(1);
    });
    const turnsAfterMount = mockDrainOutbox.mock.calls.length;

    await act(async () => {
      await result.current.discardRejected("cmd-rej");
    });
    expect(mockDiscard).toHaveBeenCalledWith(FAKE_DB, "cmd-rej");

    await act(async () => {
      await result.current.retryRejected("cmd-rej");
    });
    expect(mockRetry).toHaveBeenCalledWith(FAKE_DB, "cmd-rej");
    // Retry triggers an immediate extra drain turn.
    expect(mockDrainOutbox.mock.calls.length).toBeGreaterThan(turnsAfterMount);
  });
});

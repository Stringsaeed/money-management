import { AppState } from "react-native";
import { act, waitFor } from "@testing-library/react-native";

import { useSyncWorker } from "@/hooks/use-sync-worker";
import { useSyncModeStore } from "@/stores/sync-mode-store";
import { DELTA_DEGRADATION_THRESHOLD_MS } from "@/lib/sync/degradation";
import { createTestQueryClient, renderHookWithProviders } from "@/tests/test-utils/render";

const mockDrainOutbox = jest.fn();
const mockPullDeltas = jest.fn();
const mockCountPending = jest.fn();
const mockListRejected = jest.fn();
const mockDiscard = jest.fn();
const mockRetry = jest.fn();
const mockApply = jest.fn();
const mockGetDelta = jest.fn();
const mockStatus = jest.fn();
const mockCohereLedgerEffects = jest.fn();
const mockCohereTransactionSurfaces = jest.fn();

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

const mockUseHouseholdPush = jest.fn();
jest.mock("@/hooks/use-household-push", () => ({
  useHouseholdPush: (...args: unknown[]) => mockUseHouseholdPush(...args),
}));

jest.mock("@/lib/server/orpc", () => ({
  orpc: {
    commands: { apply: (...args: unknown[]) => mockApply(...args) },
    sync: {
      getDelta: (...args: unknown[]) => mockGetDelta(...args),
      status: (...args: unknown[]) => mockStatus(...args),
    },
  },
}));

jest.mock("@/modules/ledger-cache", () => ({
  ...jest.requireActual("@/modules/ledger-cache"),
  cohereLedgerEffects: (...args: unknown[]) => mockCohereLedgerEffects(...args),
  cohereTransactionSurfaces: (...args: unknown[]) => mockCohereTransactionSurfaces(...args),
}));

const HOUSEHOLD_ID = "household-1";

let appStateListener: ((state: string) => void) | undefined;

function defaultMocks() {
  mockDrainOutbox.mockResolvedValue({ applied: 0, rejected: 0, pending: 0 });
  mockPullDeltas.mockResolvedValue({ seq: 0, hasMore: false, changes: [] });
  mockStatus.mockResolvedValue({ killSwitchLocalOnly: false });
  mockCohereLedgerEffects.mockResolvedValue(undefined);
  mockCohereTransactionSurfaces.mockResolvedValue(undefined);
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
    useSyncModeStore.setState({ mode: "synced", reason: null });
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
    const { result } = await renderHookWithProviders(() => useSyncWorker(HOUSEHOLD_ID, "user-1"));

    // Drain and pull receive the injected db plus transports bound to oRPC.
    await waitFor(() => {
      expect(mockDrainOutbox).toHaveBeenCalledWith(
        FAKE_DB,
        HOUSEHOLD_ID,
        expect.any(Function),
        "user-1",
      );
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

    const drainSend = mockDrainOutbox.mock.calls[0][2] as (envelope: unknown) => Promise<unknown>;
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

  it("a realtime push notice triggers the same drain+pull turn as polling", async () => {
    await renderHookWithProviders(() => useSyncWorker(HOUSEHOLD_ID));
    await waitFor(() => {
      expect(mockDrainOutbox).toHaveBeenCalledTimes(1);
    });

    // The worker subscribes per household, handing its sync turn to the hook.
    expect(mockUseHouseholdPush).toHaveBeenCalledWith(HOUSEHOLD_ID, expect.any(Function));
    const onNotice = mockUseHouseholdPush.mock.calls.at(-1)?.[1] as () => void;

    await act(async () => {
      onNotice();
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(mockDrainOutbox).toHaveBeenCalledTimes(2);
      expect(mockPullDeltas).toHaveBeenCalledTimes(2);
    });
  });

  it("invalidates ledger surfaces after outbox drain settlement", async () => {
    mockDrainOutbox.mockResolvedValue({ applied: 1, rejected: 1, pending: 0 });
    const client = createTestQueryClient();
    await renderHookWithProviders(() => useSyncWorker(HOUSEHOLD_ID), { client });
    await flushTurn();

    expect(mockCohereTransactionSurfaces).toHaveBeenCalledWith(client);
  });

  it("invalidates the covered ledger queries for delta effect tags (cache coherence)", async () => {
    mockPullDeltas.mockResolvedValue({
      seq: 4,
      hasMore: false,
      changes: [{ seq: 3, effects: ["ledger", "summaries"] }],
    });
    const client = createTestQueryClient();
    await renderHookWithProviders(() => useSyncWorker(HOUSEHOLD_ID), { client });
    await flushTurn();

    expect(mockCohereLedgerEffects).toHaveBeenCalledWith(client, ["ledger", "summaries"]);
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

  it("checks the remote kill switch on startup", async () => {
    await renderHookWithProviders(() => useSyncWorker(HOUSEHOLD_ID));

    await waitFor(() => {
      expect(mockStatus).toHaveBeenCalled();
      expect(useSyncModeStore.getState().mode).toBe("synced");
    });
  });

  it("skips sync turns while the kill switch is engaged and marks the app local-only", async () => {
    mockStatus.mockResolvedValue({ killSwitchLocalOnly: true });

    await renderHookWithProviders(() => useSyncWorker(HOUSEHOLD_ID));

    await waitFor(() => {
      expect(useSyncModeStore.getState().mode).toBe("local_only");
      expect(useSyncModeStore.getState().reason).toBe("kill_switch");
    });

    // A foreground refocus must not drain or pull while the switch is on.
    await act(async () => {
      appStateListener!("active");
      await Promise.resolve();
    });
    await flushTurn();
    expect(mockDrainOutbox).not.toHaveBeenCalled();
    expect(mockPullDeltas).not.toHaveBeenCalled();
  });

  it("restores synced mode once the kill switch is turned off again", async () => {
    mockStatus.mockResolvedValue({ killSwitchLocalOnly: true });
    await renderHookWithProviders(() => useSyncWorker(HOUSEHOLD_ID));
    await waitFor(() => {
      expect(useSyncModeStore.getState().reason).toBe("kill_switch");
    });

    mockStatus.mockResolvedValue({ killSwitchLocalOnly: false });
    await act(async () => {
      appStateListener!("active");
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(useSyncModeStore.getState().mode).toBe("synced");
      expect(useSyncModeStore.getState().reason).toBeNull();
    });
  });

  it("marks local_only as soon as a drain hits the server's local_only result", async () => {
    // Status probe unreachable (fail-open) while the server itself refuses
    // writes with the typed local_only result.
    mockStatus.mockRejectedValue(new Error("status probe failed"));
    mockDrainOutbox.mockResolvedValue({
      applied: 0,
      rejected: 0,
      pending: 1,
      stoppedOnLocalOnly: true,
    });

    await renderHookWithProviders(() => useSyncWorker(HOUSEHOLD_ID));

    await waitFor(() => {
      expect(useSyncModeStore.getState().mode).toBe("local_only");
      expect(useSyncModeStore.getState().reason).toBe("kill_switch");
    });
  });

  it("degrades to local-only after delta pulls stay unavailable for 10+ minutes", async () => {
    mockPullDeltas.mockRejectedValue(new Error("network unreachable"));
    const nowSpy = jest.spyOn(Date, "now");
    const T0 = 1_700_000_000_000;

    nowSpy.mockReturnValue(T0);
    await renderHookWithProviders(() => useSyncWorker(HOUSEHOLD_ID));
    await flushTurn();

    // Still healthy at first-failure + 5min.
    nowSpy.mockReturnValue(T0 + 5 * 60_000);
    await act(async () => {
      appStateListener!("active");
      await Promise.resolve();
    });
    await flushTurn();
    expect(useSyncModeStore.getState().mode).toBe("synced");

    // Degraded at first-failure + threshold (the FIRST failure anchors it).
    nowSpy.mockReturnValue(T0 + DELTA_DEGRADATION_THRESHOLD_MS + 1);
    await act(async () => {
      appStateListener!("active");
      await Promise.resolve();
    });
    await flushTurn();

    expect(useSyncModeStore.getState().mode).toBe("local_only");
    expect(useSyncModeStore.getState().reason).toBe("delta_unavailable");

    // Recovery: one successful pull returns to synced mode.
    mockPullDeltas.mockResolvedValue({ seq: 9, hasMore: false, changes: [] });
    await act(async () => {
      appStateListener!("active");
      await Promise.resolve();
    });
    await flushTurn();

    expect(useSyncModeStore.getState().mode).toBe("synced");
    nowSpy.mockRestore();
  });
});

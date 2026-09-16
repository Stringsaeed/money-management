import { act, renderHook } from "@testing-library/react-native";

import { useSyncWorker } from "@/hooks/use-sync-worker";
import {
  reconcilePowerSyncStatus,
  type PowerSyncStatusDependencies,
} from "@/modules/powersync/status";
import { POWERSYNC_DISCONNECT_THRESHOLD_MS } from "@/modules/powersync/availability";
import { useSyncModeStore } from "@/stores/sync-mode-store";

const mockConnectPowerSync = jest.fn();
const mockDisconnectPowerSync = jest.fn();
const mockDisconnectAndClearPowerSync = jest.fn();
const mockPeekPowerSyncDatabase = jest.fn();

jest.mock("@/modules/powersync/database", () => ({
  connectPowerSync: (...args: unknown[]) => mockConnectPowerSync(...args),
  disconnectPowerSync: (...args: unknown[]) => mockDisconnectPowerSync(...args),
  disconnectAndClearPowerSync: (...args: unknown[]) => mockDisconnectAndClearPowerSync(...args),
  peekPowerSyncDatabase: () => mockPeekPowerSyncDatabase(),
}));

jest.mock("@tanstack/react-query", () => ({
  useQuery: () => ({
    data: { killSwitchLocalOnly: false },
    refetch: jest.fn(),
  }),
}));

const createDependencies = (initialReason: string | null = null) => {
  let reason = initialReason;
  const connect = jest.fn(async () => undefined);
  const disconnect = jest.fn(async () => undefined);
  const disconnectAndClear = jest.fn(async () => undefined);
  const setLocalOnly = jest.fn((next: "kill_switch") => {
    reason = next;
  });
  const setSynced = jest.fn(() => {
    reason = null;
  });
  const dependencies: PowerSyncStatusDependencies = {
    connect,
    disconnect,
    disconnectAndClear,
    reason: () => reason,
    setLocalOnly,
    setSynced,
  };
  return { connect, dependencies, disconnect, disconnectAndClear, setLocalOnly, setSynced };
};

describe("reconcilePowerSyncStatus", () => {
  it("connects an eligible signed-in migrated household", async () => {
    const harness = createDependencies();

    await reconcilePowerSyncStatus(
      { householdId: "household-1", userId: "user-1", killSwitchLocalOnly: false },
      harness.dependencies,
    );

    expect(harness.connect).toHaveBeenCalledWith("user-1");
    expect(harness.disconnect).not.toHaveBeenCalled();
  });

  it("disconnects immediately and enters local-only mode when the kill switch is on", async () => {
    const harness = createDependencies();

    await reconcilePowerSyncStatus(
      { householdId: "household-1", userId: "user-1", killSwitchLocalOnly: true },
      harness.dependencies,
    );

    expect(harness.setLocalOnly).toHaveBeenCalledWith("kill_switch");
    expect(harness.disconnect).toHaveBeenCalledTimes(1);
    expect(harness.connect).not.toHaveBeenCalled();
  });

  it("restores synced mode and reconnects after the kill switch turns off", async () => {
    const harness = createDependencies("kill_switch");

    await reconcilePowerSyncStatus(
      { householdId: "household-1", userId: "user-1", killSwitchLocalOnly: false },
      harness.dependencies,
    );

    expect(harness.setSynced).toHaveBeenCalledTimes(1);
    expect(harness.connect).toHaveBeenCalledWith("user-1");
  });

  it("replaces a PowerSync-unavailable fallback after the connection recovers", async () => {
    const harness = createDependencies("powersync_unavailable");

    await reconcilePowerSyncStatus(
      { householdId: "household-1", userId: "user-1", killSwitchLocalOnly: false },
      harness.dependencies,
    );

    expect(harness.setSynced).toHaveBeenCalledTimes(1);
    expect(harness.connect).toHaveBeenCalledWith("user-1");
  });

  it("connects when personal ledger sync is enrolled without an active household", async () => {
    const harness = createDependencies();

    await reconcilePowerSyncStatus(
      {
        householdId: null,
        userId: "user-1",
        syncPersonalLedger: true,
        killSwitchLocalOnly: false,
      },
      harness.dependencies,
    );

    expect(harness.connect).toHaveBeenCalledWith("user-1");
  });

  it("disconnects without constructing a database for an ineligible local-only selection", async () => {
    const harness = createDependencies();

    await reconcilePowerSyncStatus(
      { householdId: null, userId: undefined, killSwitchLocalOnly: false },
      harness.dependencies,
    );

    expect(harness.disconnectAndClear).toHaveBeenCalledTimes(1);
    expect(harness.connect).not.toHaveBeenCalled();
  });

  it("preserves cached rows while access is transient or remotely revoked", async () => {
    const harness = createDependencies();

    await reconcilePowerSyncStatus(
      {
        householdId: null,
        userId: undefined,
        killSwitchLocalOnly: false,
        preserveWhenIneligible: true,
      },
      harness.dependencies,
    );

    expect(harness.disconnect).toHaveBeenCalledTimes(1);
    expect(harness.disconnectAndClear).not.toHaveBeenCalled();
    expect(harness.connect).not.toHaveBeenCalled();
  });

  it("connects even when kill switch status is still pending (#307)", async () => {
    const harness = createDependencies();

    await reconcilePowerSyncStatus(
      {
        householdId: null,
        userId: "user-1",
        syncPersonalLedger: true,
        killSwitchLocalOnly: undefined,
      },
      harness.dependencies,
    );

    expect(harness.connect).toHaveBeenCalledWith("user-1");
    expect(harness.disconnect).not.toHaveBeenCalled();
  });

  it("connects a household when kill switch status is still pending", async () => {
    const harness = createDependencies();

    await reconcilePowerSyncStatus(
      {
        householdId: "household-1",
        userId: "user-1",
        killSwitchLocalOnly: undefined,
      },
      harness.dependencies,
    );

    expect(harness.connect).toHaveBeenCalledWith("user-1");
    expect(harness.disconnect).not.toHaveBeenCalled();
  });
});

describe("useSyncWorker availability", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-09-07T00:00:00.000Z"));
    jest.clearAllMocks();
    useSyncModeStore.setState({ mode: "synced", reason: null });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("degrades after ten disconnected minutes and restores on reconnect", async () => {
    let statusChanged: ((status: { connected: boolean }) => void) | undefined;
    const database = {
      currentStatus: { connected: false },
      getUploadQueueStats: jest.fn(async () => ({ count: 0 })),
      registerListener: jest.fn(
        (listener: { statusChanged: (status: { connected: boolean }) => void }) => {
          statusChanged = listener.statusChanged;
          return jest.fn();
        },
      ),
    };
    mockConnectPowerSync.mockResolvedValue(database);
    mockPeekPowerSyncDatabase.mockReturnValue(database);

    const { unmount } = await renderHook(() =>
      useSyncWorker({ householdId: "household-1", userId: "user-1" }),
    );
    await act(async () => {
      await Promise.resolve();
    });

    expect(database.registerListener).toHaveBeenCalledTimes(1);
    expect(useSyncModeStore.getState()).toMatchObject({ mode: "synced", reason: null });

    act(() => {
      jest.advanceTimersByTime(POWERSYNC_DISCONNECT_THRESHOLD_MS);
    });
    expect(useSyncModeStore.getState()).toMatchObject({
      mode: "local_only",
      reason: "powersync_unavailable",
    });

    act(() => {
      statusChanged?.({ connected: true });
    });
    expect(useSyncModeStore.getState()).toMatchObject({ mode: "synced", reason: null });

    await unmount();
  });
});

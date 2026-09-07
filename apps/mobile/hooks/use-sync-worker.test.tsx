import {
  reconcilePowerSyncStatus,
  type PowerSyncStatusDependencies,
} from "@/modules/powersync/status";

const createDependencies = (initialReason: string | null = null) => {
  let reason = initialReason;
  const connect = jest.fn(async () => undefined);
  const disconnect = jest.fn(async () => undefined);
  const setLocalOnly = jest.fn((next: "kill_switch") => {
    reason = next;
  });
  const setSynced = jest.fn(() => {
    reason = null;
  });
  const dependencies: PowerSyncStatusDependencies = {
    connect,
    disconnect,
    reason: () => reason,
    setLocalOnly,
    setSynced,
  };
  return { connect, dependencies, disconnect, setLocalOnly, setSynced };
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

  it("replaces a legacy delta-unavailable fallback with the PowerSync connection", async () => {
    const harness = createDependencies("delta_unavailable");

    await reconcilePowerSyncStatus(
      { householdId: "household-1", userId: "user-1", killSwitchLocalOnly: false },
      harness.dependencies,
    );

    expect(harness.setSynced).toHaveBeenCalledTimes(1);
    expect(harness.connect).toHaveBeenCalledWith("user-1");
  });

  it("disconnects without constructing a database for an ineligible local-only selection", async () => {
    const harness = createDependencies();

    await reconcilePowerSyncStatus(
      { householdId: null, userId: undefined, killSwitchLocalOnly: false },
      harness.dependencies,
    );

    expect(harness.disconnect).toHaveBeenCalledTimes(1);
    expect(harness.connect).not.toHaveBeenCalled();
  });
});

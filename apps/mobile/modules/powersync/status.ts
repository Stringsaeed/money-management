export interface PowerSyncStatusDependencies {
  readonly connect: (userId: string) => Promise<void>;
  readonly disconnectAndClear: () => Promise<void>;
  readonly disconnect: () => Promise<void>;
  readonly reason: () => string | null;
  readonly setLocalOnly: (reason: "kill_switch") => void;
  readonly setSynced: () => void;
}

export const reconcilePowerSyncStatus = async (
  input: {
    readonly householdId: string | null;
    readonly userId?: string;
    readonly syncPersonalLedger?: boolean;
    readonly killSwitchLocalOnly?: boolean;
    readonly preserveWhenIneligible?: boolean;
  },
  dependencies: PowerSyncStatusDependencies,
): Promise<void> => {
  const userId = input.userId;
  if (!userId || !(input.householdId || input.syncPersonalLedger)) {
    if (input.preserveWhenIneligible) {
      await dependencies.disconnect();
    } else {
      await dependencies.disconnectAndClear();
    }
    return;
  }
  if (input.killSwitchLocalOnly === undefined) return;
  if (input.killSwitchLocalOnly) {
    if (dependencies.reason() !== "kill_switch") dependencies.setLocalOnly("kill_switch");
    await dependencies.disconnect();
    return;
  }
  if (dependencies.reason() !== null) dependencies.setSynced();
  await dependencies.connect(userId);
};

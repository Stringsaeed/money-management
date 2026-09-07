export interface PowerSyncStatusDependencies {
  readonly connect: (userId: string) => Promise<void>;
  readonly disconnect: () => Promise<void>;
  readonly reason: () => string | null;
  readonly setLocalOnly: (reason: "kill_switch") => void;
  readonly setSynced: () => void;
}

export const reconcilePowerSyncStatus = async (
  input: {
    readonly householdId: string | null;
    readonly userId?: string;
    readonly killSwitchLocalOnly?: boolean;
  },
  dependencies: PowerSyncStatusDependencies,
): Promise<void> => {
  if (!input.householdId || !input.userId) {
    await dependencies.disconnect();
    return;
  }
  if (input.killSwitchLocalOnly === undefined) return;
  if (input.killSwitchLocalOnly) {
    if (dependencies.reason() !== "kill_switch") dependencies.setLocalOnly("kill_switch");
    await dependencies.disconnect();
    return;
  }
  if (dependencies.reason() !== null) dependencies.setSynced();
  await dependencies.connect(input.userId);
};

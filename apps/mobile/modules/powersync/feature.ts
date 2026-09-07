export const isPowerSyncEnabled = (): boolean =>
  process.env.EXPO_PUBLIC_POWERSYNC_ENABLED !== "false";

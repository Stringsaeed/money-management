export const POWERSYNC_DISCONNECT_THRESHOLD_MS = 10 * 60_000;

export interface PowerSyncAvailability {
  readonly disconnectedAt: number | null;
}

export const initialPowerSyncAvailability = (): PowerSyncAvailability => ({
  disconnectedAt: null,
});

export const recordPowerSyncConnection = (
  current: PowerSyncAvailability,
  connected: boolean,
  now: number,
): PowerSyncAvailability => {
  if (connected) return initialPowerSyncAvailability();
  return current.disconnectedAt === null ? { disconnectedAt: now } : current;
};

export const isPowerSyncUnavailable = (current: PowerSyncAvailability, now: number): boolean =>
  current.disconnectedAt !== null &&
  now - current.disconnectedAt >= POWERSYNC_DISCONNECT_THRESHOLD_MS;

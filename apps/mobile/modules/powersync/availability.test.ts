import {
  initialPowerSyncAvailability,
  isPowerSyncUnavailable,
  POWERSYNC_DISCONNECT_THRESHOLD_MS,
  recordPowerSyncConnection,
} from "./availability";

describe("PowerSync availability", () => {
  it("degrades only after ten continuous disconnected minutes", () => {
    const disconnected = recordPowerSyncConnection(initialPowerSyncAvailability(), false, 1000);
    expect(isPowerSyncUnavailable(disconnected, 1000 + POWERSYNC_DISCONNECT_THRESHOLD_MS - 1)).toBe(
      false,
    );
    expect(isPowerSyncUnavailable(disconnected, 1000 + POWERSYNC_DISCONNECT_THRESHOLD_MS)).toBe(
      true,
    );
  });

  it("resets the outage window immediately after reconnect", () => {
    const disconnected = recordPowerSyncConnection(initialPowerSyncAvailability(), false, 1000);
    const connected = recordPowerSyncConnection(disconnected, true, 2000);
    expect(connected).toEqual({ disconnectedAt: null });
    expect(isPowerSyncUnavailable(connected, Number.MAX_SAFE_INTEGER)).toBe(false);
  });
});

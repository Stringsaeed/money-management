import { isPowerSyncEnabled } from "./feature";

const initialValue = process.env.EXPO_PUBLIC_POWERSYNC_ENABLED;

afterEach(() => {
  if (initialValue === undefined) delete process.env.EXPO_PUBLIC_POWERSYNC_ENABLED;
  else process.env.EXPO_PUBLIC_POWERSYNC_ENABLED = initialValue;
});

describe("PowerSync feature gate", () => {
  it("enables PowerSync by default", () => {
    delete process.env.EXPO_PUBLIC_POWERSYNC_ENABLED;
    expect(isPowerSyncEnabled()).toBe(true);
  });

  it("preserves the pre-PowerSync path only when explicitly disabled", () => {
    process.env.EXPO_PUBLIC_POWERSYNC_ENABLED = "false";
    expect(isPowerSyncEnabled()).toBe(false);
  });
});

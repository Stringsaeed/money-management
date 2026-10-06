import { test as base } from "@e2e-dev/mobile";
import { expect } from "e2e";

// The first launch after Metro boots can still be loading JS, so the opening screen gets longer.
const FIRST_SCREEN_TIMEOUT = 60_000;

/**
 * Fixtures declared here run for every test registered through the returned `test`, whether
 * or not the test destructures them.
 *
 * Every test starts signed out with an empty keychain (where the app keeps its session) and
 * then continues as a brand-new guest, so each test owns a fresh, empty ledger on the local API.
 */
export const test = base.extend<{ guest: void }>({
  guest: async ({ app, device, screen }, provide) => {
    await device.clearKeychain();
    await app.open();
    // The button shows while the stored session is still loading but ignores taps until it is
    // enabled, and the mobile engine taps without waiting for that.
    const continueAsGuest = screen.getByRole("button", "Continue as guest");
    await expect(continueAsGuest).toBeEnabled({ timeout: FIRST_SCREEN_TIMEOUT });
    await continueAsGuest.tap();
    await expect(screen.getByText("Add an account to start your overview.")).toBeVisible({
      timeout: 30_000,
    });
    await provide();
  },
});

export const signedOutTest = base.extend<{ signedOut: void }>({
  signedOut: async ({ app, device, screen }, provide) => {
    await device.clearKeychain();
    await app.open();
    await expect(screen.getByRole("button", "Continue as guest")).toBeVisible({
      timeout: FIRST_SCREEN_TIMEOUT,
    });
    await provide();
  },
});

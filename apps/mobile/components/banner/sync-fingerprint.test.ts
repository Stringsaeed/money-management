import { describe, expect, it } from "@jest/globals";

import { syncFingerprint } from "./banner-fingerprint";

describe("syncFingerprint", () => {
  it("locks local-only sync fingerprints", () => {
    expect(syncFingerprint("kill_switch")).toBe("local_only:kill_switch");
    expect(syncFingerprint("powersync_unavailable")).toBe("local_only:powersync_unavailable");
  });
});

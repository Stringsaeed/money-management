import { describe, expect, it } from "@jest/globals";

import { ENABLE_SYNC_STATUS_LABEL } from "./enable-sync-copy";

describe("ENABLE_SYNC_STATUS_LABEL", () => {
  it("locks enable-sync status label vocabulary", () => {
    expect(ENABLE_SYNC_STATUS_LABEL).toEqual({
      idle: "",
      creating_household: "Creating household…",
      backing_up: "Backing up your local data…",
      uploading: "Uploading your budget…",
      verifying: "Verifying…",
      matched: "Synced ☁️",
      mismatched: "Paused — data didn't reconcile",
      error: "Something went wrong",
    });
  });
});

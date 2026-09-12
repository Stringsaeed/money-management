import { describe, expect, it } from "@jest/globals";

import { ENABLE_SYNC_MISMATCH_DESCRIPTION } from "./enable-sync-copy";

describe("ENABLE_SYNC_MISMATCH_DESCRIPTION", () => {
  it("locks the mismatch enable-sync description", () => {
    expect(ENABLE_SYNC_MISMATCH_DESCRIPTION).toBe(
      "The upload didn't reconcile — your local data is unchanged. Try again.",
    );
  });
});

import { describe, expect, it } from "@jest/globals";

import { ENABLE_SYNC_MATCHED_DESCRIPTION } from "./enable-sync-copy";

describe("ENABLE_SYNC_MATCHED_DESCRIPTION", () => {
  it("locks the matched enable-sync description", () => {
    expect(ENABLE_SYNC_MATCHED_DESCRIPTION).toBe(
      "Your data stays synced across devices.",
    );
  });
});

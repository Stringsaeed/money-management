import { describe, expect, it } from "@jest/globals";

import { ENABLE_SYNC_IDLE_DESCRIPTION } from "./enable-sync-copy";

describe("ENABLE_SYNC_IDLE_DESCRIPTION", () => {
  it("locks the idle enable-sync description", () => {
    expect(ENABLE_SYNC_IDLE_DESCRIPTION).toBe(
      "Back up your data and keep it in sync across devices.",
    );
  });
});

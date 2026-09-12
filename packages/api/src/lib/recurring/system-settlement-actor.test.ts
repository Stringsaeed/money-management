import { describe, expect, it } from "vitest";

import { SYSTEM_SETTLEMENT_ACTOR_ID } from "./scheduler";

describe("SYSTEM_SETTLEMENT_ACTOR_ID", () => {
  it("locks the non-human actor id for recurring settlement commands", () => {
    expect(SYSTEM_SETTLEMENT_ACTOR_ID).toBe("user-system-settlement");
  });
});

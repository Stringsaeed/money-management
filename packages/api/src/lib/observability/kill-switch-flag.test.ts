import { describe, expect, it } from "vitest";

import { KILL_SWITCH_FLAG } from "./kill-switch";

describe("KILL_SWITCH_FLAG", () => {
  it("locks the local-only kill-switch flag name", () => {
    expect(KILL_SWITCH_FLAG).toBe("KILL_SWITCH_LOCAL_ONLY");
  });
});

import { describe, expect, it } from "vitest";

import { isKillSwitchEngaged, KILL_SWITCH_FLAG, LOCAL_ONLY_RESULT } from "./kill-switch";

describe("LOCAL_ONLY_RESULT", () => {
  it("is the typed local_only kill-switch response shape", () => {
    expect(LOCAL_ONLY_RESULT).toEqual({
      kind: "local_only",
      reason: "kill_switch_local_only",
    });
  });

  it("keeps reason aligned with the kill-switch flag vocabulary", () => {
    expect(LOCAL_ONLY_RESULT.reason).toBe("kill_switch_local_only");
    expect(KILL_SWITCH_FLAG).toBe("KILL_SWITCH_LOCAL_ONLY");
  });
});

describe("kill switch", () => {
  it("engages on truthy flag spellings", () => {
    expect(isKillSwitchEngaged("on")).toBe(true);
    expect(isKillSwitchEngaged("true")).toBe(true);
    expect(isKillSwitchEngaged("1")).toBe(true);
    expect(isKillSwitchEngaged("ON")).toBe(true);
  });

  it("stays off for absent or non-truthy values", () => {
    expect(isKillSwitchEngaged(undefined)).toBe(false);
    expect(isKillSwitchEngaged("")).toBe(false);
    expect(isKillSwitchEngaged("off")).toBe(false);
    expect(isKillSwitchEngaged("false")).toBe(false);
    expect(isKillSwitchEngaged("0")).toBe(false);
  });
});

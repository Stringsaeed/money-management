import { describe, expect, it } from "vitest";

import { isKillSwitchEngaged } from "./kill-switch";

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

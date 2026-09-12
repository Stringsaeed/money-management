import { describe, expect, it } from "@jest/globals";

import { REPEAT_PRESETS, presetKeyFor } from "./presets";

describe("presetKeyFor", () => {
  it("maps each REPEAT_PRESETS frequency/interval pair to its key", () => {
    for (const preset of REPEAT_PRESETS) {
      expect(presetKeyFor(preset.frequency, preset.intervalCount)).toBe(preset.key);
    }
  });

  it("returns custom when frequency or intervalCount do not match a preset", () => {
    expect(presetKeyFor("day", 2)).toBe("custom");
    expect(presetKeyFor("week", 3)).toBe("custom");
    expect(presetKeyFor("month", 3)).toBe("custom");
    expect(presetKeyFor("year", 2)).toBe("custom");
  });
});

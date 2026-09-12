import { describe, expect, it } from "@jest/globals";

import { ACTIVITY_RANGE_PRESETS } from "./activity";

describe("ACTIVITY_RANGE_PRESETS", () => {
  it("locks activity range preset vocabulary", () => {
    expect(ACTIVITY_RANGE_PRESETS).toEqual([
      { key: "all", label: "All Time", days: null },
      { key: "7d", label: "Last 7 Days", days: 7 },
      { key: "30d", label: "Last 30 Days", days: 30 },
      { key: "90d", label: "Last 90 Days", days: 90 },
    ]);
  });
});

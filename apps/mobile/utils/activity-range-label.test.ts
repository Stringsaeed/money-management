import { describe, expect, it } from "@jest/globals";

import { activityRangeLabel } from "./activity";

describe("activityRangeLabel", () => {
  it("resolves preset labels with All Time fallback", () => {
    expect(activityRangeLabel("7d")).toBe("Last 7 Days");
    expect(activityRangeLabel("all")).toBe("All Time");
    expect(activityRangeLabel("nope")).toBe("All Time");
  });
});

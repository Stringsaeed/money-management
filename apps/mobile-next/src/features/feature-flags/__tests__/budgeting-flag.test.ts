import { parseCachedBudgeting, resolveBudgetingFlag } from "../budgeting-flag";

const base = { hasClient: true, live: undefined, cached: undefined, cacheRead: true } as const;

describe("resolveBudgetingFlag", () => {
  it("is off without a PostHog client, whatever was cached", () => {
    expect(resolveBudgetingFlag({ ...base, hasClient: false, live: true, cached: true })).toBe(
      "off",
    );
  });

  it("is off on a first launch with nothing cached until flags load", () => {
    expect(resolveBudgetingFlag(base)).toBe("off");
  });

  it("is unsettled, not on, while the cache is still being read", () => {
    expect(resolveBudgetingFlag({ ...base, cacheRead: false })).toBe("unsettled");
  });

  it("uses the cached answer before flags load", () => {
    expect(resolveBudgetingFlag({ ...base, cached: true })).toBe("on");
    expect(resolveBudgetingFlag({ ...base, cached: false })).toBe("off");
  });

  it("prefers PostHog's answer over the cache in both directions", () => {
    expect(resolveBudgetingFlag({ ...base, live: true, cached: false })).toBe("on");
    expect(resolveBudgetingFlag({ ...base, live: false, cached: true })).toBe("off");
  });

  it("is on from a live answer even while the cache is unread", () => {
    expect(resolveBudgetingFlag({ ...base, live: true, cacheRead: false })).toBe("on");
  });
});

describe("parseCachedBudgeting", () => {
  it("reads only the two values it writes", () => {
    expect(parseCachedBudgeting("on")).toBe(true);
    expect(parseCachedBudgeting("off")).toBe(false);
    expect(parseCachedBudgeting(null)).toBeUndefined();
    expect(parseCachedBudgeting("true")).toBeUndefined();
  });
});

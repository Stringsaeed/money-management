import { describe, expect, it } from "vitest";

import { HOUSEHOLD_RECONCILE_MAX_AGE_MS } from "./reconcile";

describe("HOUSEHOLD_RECONCILE_MAX_AGE_MS", () => {
  it("locks household reconcile max age at one minute", () => {
    expect(HOUSEHOLD_RECONCILE_MAX_AGE_MS).toBe(60_000);
  });
});

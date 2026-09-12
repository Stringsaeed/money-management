import { describe, expect, it } from "vitest";

import { USER_RECONCILE_MAX_AGE_MS } from "./reconcile";

describe("USER_RECONCILE_MAX_AGE_MS", () => {
  it("locks user reconcile max age at one minute", () => {
    expect(USER_RECONCILE_MAX_AGE_MS).toBe(60_000);
  });
});

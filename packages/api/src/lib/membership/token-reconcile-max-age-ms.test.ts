import { describe, expect, it } from "vitest";

import { TOKEN_RECONCILE_MAX_AGE_MS } from "./reconcile";

describe("TOKEN_RECONCILE_MAX_AGE_MS", () => {
  it("locks token reconcile max age at five minutes", () => {
    expect(TOKEN_RECONCILE_MAX_AGE_MS).toBe(5 * 60_000);
  });
});

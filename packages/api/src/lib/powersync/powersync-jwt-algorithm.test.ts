import { describe, expect, it } from "vitest";

import { POWERSYNC_JWT_ALGORITHM } from "./key";

describe("POWERSYNC_JWT_ALGORITHM", () => {
  it("locks the PowerSync JWT algorithm", () => {
    expect(POWERSYNC_JWT_ALGORITHM).toBe("ES256");
  });
});

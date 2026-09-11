import { describe, expect, it } from "@jest/globals";

import { normalizeAuthEmail } from "./email";

describe("auth email normalization", () => {
  it("trims surrounding whitespace and lowercases the address", () => {
    expect(normalizeAuthEmail("  Ada@Trove.ING ")).toBe("ada@trove.ing");
  });
});

import { describe, expect, it } from "@jest/globals";

import { DATABASE_RESET_VERSION } from "./reset";

describe("DATABASE_RESET_VERSION", () => {
  it("locks the on-device database reset version", () => {
    expect(DATABASE_RESET_VERSION).toBe(1);
  });
});

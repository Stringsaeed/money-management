import { describe, expect, it } from "@jest/globals";

import { isCustomAccountIcon } from "./utils";

describe("isCustomAccountIcon", () => {
  it("treats emoji icons as custom and SF Symbol names as system", () => {
    expect(isCustomAccountIcon("💳")).toBe(true);
    expect(isCustomAccountIcon("creditcard.fill")).toBe(false);
    expect(isCustomAccountIcon("")).toBe(false);
  });
});

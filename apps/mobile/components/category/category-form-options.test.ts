import { describe, expect, it } from "@jest/globals";

import { DEFAULT_CATEGORY_ICON } from "./category-form-options";

describe("DEFAULT_CATEGORY_ICON", () => {
  it("locks the default category emoji", () => {
    expect(DEFAULT_CATEGORY_ICON).toBe("🏷️");
  });
});

import { describe, expect, it } from "@jest/globals";

import { requireCategoryIds } from "./envelope-validation";

describe("requireCategoryIds", () => {
  it("returns distinct non-empty category ids", () => {
    expect(requireCategoryIds(["category-one", "category-two"])).toEqual([
      "category-one",
      "category-two",
    ]);
  });

  it("rejects empty, duplicate, or blank category ids", () => {
    expect(() => requireCategoryIds([])).toThrow(/distinct expense Category/);
    expect(() => requireCategoryIds(["category-one", "category-one"])).toThrow(
      /distinct expense Category/,
    );
    expect(() => requireCategoryIds(["category-one", "  "])).toThrow(/distinct expense Category/);
  });
});

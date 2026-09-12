import { describe, expect, it } from "@jest/globals";

import { changedCategoryIds } from "./category-selection";

describe("changedCategoryIds", () => {
  it("returns ids added or removed between selections", () => {
    expect(changedCategoryIds(["a", "b"], ["b", "c"])).toEqual(["a", "c"]);
  });

  it("returns an empty list when selections are identical", () => {
    expect(changedCategoryIds(["a", "b"], ["b", "a"])).toEqual([]);
  });
});

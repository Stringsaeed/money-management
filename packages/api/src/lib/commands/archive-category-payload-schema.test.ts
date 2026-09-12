import { describe, expect, it } from "vitest";

import { archiveCategoryPayloadSchema } from "./handlers/category";

describe("archiveCategoryPayloadSchema", () => {
  it("accepts a non-empty categoryId", () => {
    expect(archiveCategoryPayloadSchema.safeParse({ categoryId: "cat_1" })).toEqual({
      success: true,
      data: { categoryId: "cat_1" },
    });
  });

  it("rejects a blank categoryId", () => {
    expect(archiveCategoryPayloadSchema.safeParse({ categoryId: "" }).success).toBe(false);
    expect(archiveCategoryPayloadSchema.safeParse({}).success).toBe(false);
  });
});

import { describe, expect, it } from "vitest";

import {
  createCategoryPayloadSchema,
  updateCategoryPayloadSchema,
} from "./handlers/category";

describe("createCategoryPayloadSchema", () => {
  it("accepts a minimal category and applies defaults", () => {
    const parsed = createCategoryPayloadSchema.safeParse({
      name: "Groceries",
      type: "expense",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toMatchObject({
        name: "Groceries",
        type: "expense",
        color: "#FF6B6B",
        icon: "🏷️",
        parentId: null,
        sortOrder: 0,
      });
    }
  });

  it("rejects blank name and unknown type", () => {
    expect(createCategoryPayloadSchema.safeParse({ name: "", type: "expense" }).success).toBe(
      false,
    );
    expect(
      createCategoryPayloadSchema.safeParse({ name: "Bonus", type: "transfer" }).success,
    ).toBe(false);
  });
});

describe("updateCategoryPayloadSchema", () => {
  it("accepts categoryId with optional patch fields", () => {
    const parsed = updateCategoryPayloadSchema.safeParse({
      categoryId: "cat_1",
      name: "Food",
      color: "#112233",
      icon: "cart.fill",
      parentId: null,
      sortOrder: 3,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toEqual({
        categoryId: "cat_1",
        name: "Food",
        color: "#112233",
        icon: "cart.fill",
        parentId: null,
        sortOrder: 3,
      });
    }
  });

  it("rejects blank categoryId and blank optional name", () => {
    expect(updateCategoryPayloadSchema.safeParse({ categoryId: "" }).success).toBe(false);
    expect(
      updateCategoryPayloadSchema.safeParse({ categoryId: "cat_1", name: "" }).success,
    ).toBe(false);
  });
});

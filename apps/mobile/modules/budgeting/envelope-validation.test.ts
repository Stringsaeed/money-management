import { describe, expect, it } from "@jest/globals";

import {
  requireCategoryIds,
  requireChangedCategoryIds,
  requireEnvelopeFields,
} from "./envelope-validation";

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

describe("requireEnvelopeFields", () => {
  it("accepts trimmed name, emoji, and color", () => {
    expect(() =>
      requireEnvelopeFields({ name: "Groceries", icon: "🛒", color: "#8B9D83" }),
    ).not.toThrow();
  });

  it("rejects blank name, emoji, or color", () => {
    expect(() =>
      requireEnvelopeFields({ name: "   ", icon: "🛒", color: "#8B9D83" }),
    ).toThrow("Envelope name is required.");
    expect(() =>
      requireEnvelopeFields({ name: "Groceries", icon: "  ", color: "#8B9D83" }),
    ).toThrow("Envelope emoji is required.");
    expect(() =>
      requireEnvelopeFields({ name: "Groceries", icon: "🛒", color: "\t" }),
    ).toThrow("Envelope color is required.");
  });
});

describe("requireChangedCategoryIds", () => {
  it("returns distinct non-empty changed category ids", () => {
    expect(requireChangedCategoryIds(["category-a", "category-b"])).toEqual([
      "category-a",
      "category-b",
    ]);
    expect(requireChangedCategoryIds([])).toEqual([]);
  });

  it("rejects duplicate or blank changed category ids", () => {
    expect(() => requireChangedCategoryIds(["category-a", "category-a"])).toThrow(
      "Changed Envelope Category IDs must be distinct and non-empty strings.",
    );
    expect(() => requireChangedCategoryIds(["category-a", "  "])).toThrow(
      "Changed Envelope Category IDs must be distinct and non-empty strings.",
    );
  });
});

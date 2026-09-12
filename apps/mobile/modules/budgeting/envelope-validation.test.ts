import { describe, expect, it } from "@jest/globals";

import {
  type EnvelopeCategoryRow,
  requireCategoryIds,
  requireChangedCategoryIds,
  requireEnvelopeFields,
  requireRestoredCategoryConfirmation,
} from "./envelope-validation";

const category = (
  overrides: Partial<EnvelopeCategoryRow> & Pick<EnvelopeCategoryRow, "id">,
): EnvelopeCategoryRow => ({
  lifecycle: "active",
  lifecycleChangedAt: null,
  type: "expense",
  incompatibleTransactionCount: 0,
  mappedEnvelopeId: null,
  mappedThroughPeriod: null,
  futureMappedEnvelopeId: null,
  futureMappingPeriod: null,
  ...overrides,
});

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

describe("requireRestoredCategoryConfirmation", () => {
  it("allows restored categories that are confirmed or already mapped to the target", () => {
    const target = "envelope-1";
    const rows = [
      category({
        id: "cat-confirmed",
        lifecycleChangedAt: "2026-08-01T00:00:00.000Z",
      }),
      category({
        id: "cat-ongoing",
        lifecycleChangedAt: "2026-08-02T00:00:00.000Z",
        mappedEnvelopeId: target,
        mappedThroughPeriod: null,
      }),
      category({
        id: "cat-scheduled",
        lifecycleChangedAt: "2026-08-03T00:00:00.000Z",
        futureMappedEnvelopeId: target,
      }),
      category({ id: "cat-untouched", lifecycleChangedAt: null }),
    ];

    expect(() =>
      requireRestoredCategoryConfirmation(rows, ["cat-confirmed"], target),
    ).not.toThrow();
  });

  it("rejects a restored category that still needs confirmation", () => {
    const target = "envelope-2";
    const rows = [
      category({
        id: "cat-needs-confirm",
        lifecycleChangedAt: "2026-08-04T00:00:00.000Z",
      }),
    ];

    expect(() => requireRestoredCategoryConfirmation(rows, undefined, target)).toThrow(
      "Confirm restored Category cat-needs-confirm before creating its future Mapping.",
    );
    expect(() => requireRestoredCategoryConfirmation(rows, [], target)).toThrow(
      "Confirm restored Category cat-needs-confirm before creating its future Mapping.",
    );
  });
});

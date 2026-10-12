import type { V2Category } from "@trove/api/v2/contracts";

import { categoryEmoji, envelopeEmoji } from "../envelope-emoji";

const category = (id: string, icon: string): V2Category => ({
  id,
  ledgerId: "ledger",
  name: id,
  kind: "expense",
  color: "#000000",
  icon,
  parentId: null,
  sortOrder: 0,
  archived: false,
  version: 1,
  createdAt: "2026-10-01T00:00:00Z",
  updatedAt: "2026-10-01T00:00:00Z",
});

describe("categoryEmoji", () => {
  it("returns the person's own emoji", () => {
    expect(categoryEmoji(category("a", "🍽️"))).toBe("🍽️");
  });

  it("skips Trove icon names and blanks", () => {
    expect(categoryEmoji(category("a", "groceries"))).toBeUndefined();
    expect(categoryEmoji(category("a", " "))).toBeUndefined();
    expect(categoryEmoji(undefined)).toBeUndefined();
  });
});

describe("envelopeEmoji", () => {
  it("uses the first mapped Category that has an emoji", () => {
    const categories = [category("a", "groceries"), category("b", "🛒")];
    expect(envelopeEmoji({ categoryIds: ["a", "b"] }, categories)).toBe("🛒");
  });

  it("is undefined when no mapped Category has one", () => {
    expect(envelopeEmoji({ categoryIds: ["x"] }, [category("a", "🛒")])).toBeUndefined();
  });
});

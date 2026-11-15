import {
  categoriesById,
  envelopeEmoji,
  envelopeEmojiOrTag,
  ownCategoryEmoji,
} from "../envelope-emoji";

const categories = categoriesById([
  { id: "slug", icon: "tag" },
  { id: "drawn", icon: "groceries" },
  { id: "blank", icon: " " },
  { id: "food", icon: "🛒" },
  { id: "fuel", icon: "⛽" },
]);

describe("ownCategoryEmoji", () => {
  it("returns the person's own emoji", () => {
    expect(ownCategoryEmoji({ icon: "🍽️" })).toBe("🍽️");
  });

  it("skips legacy slugs, Trove icon names, and blanks", () => {
    expect(ownCategoryEmoji({ icon: "tag" })).toBeNull();
    expect(ownCategoryEmoji({ icon: "groceries" })).toBeNull();
    expect(ownCategoryEmoji({ icon: " " })).toBeNull();
    expect(ownCategoryEmoji(undefined)).toBeNull();
  });
});

describe("envelopeEmoji", () => {
  it("takes the first of the envelope's Categories that has an emoji", () => {
    expect(envelopeEmoji({ categoryIds: ["missing", "slug", "fuel", "food"] }, categories)).toBe(
      "⛽",
    );
  });

  it("is null when none has one", () => {
    expect(
      envelopeEmoji({ categoryIds: ["slug", "drawn", "blank", "missing"] }, categories),
    ).toBeNull();
    expect(envelopeEmoji({ categoryIds: [] }, categories)).toBeNull();
  });
});

describe("envelopeEmojiOrTag", () => {
  it("falls back to the tag when no mapped Category has an emoji", () => {
    expect(envelopeEmojiOrTag({ categoryIds: ["food"] }, categories)).toBe("🛒");
    expect(envelopeEmojiOrTag({ categoryIds: ["slug"] }, categories)).toBe("🏷️");
    expect(envelopeEmojiOrTag({ categoryIds: [] }, categories)).toBe("🏷️");
  });
});

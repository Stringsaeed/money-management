import { envelopeEmoji } from "../envelope-emoji";

const categories = [
  { id: "tag", icon: "tag" },
  { id: "food", icon: "🛒" },
  { id: "fuel", icon: "⛽" },
];

describe("envelopeEmoji", () => {
  it("takes the first of the envelope's Categories that has an emoji", () => {
    expect(envelopeEmoji({ categoryIds: ["tag", "fuel", "food"] }, categories)).toBe("⛽");
  });

  it("is null when none has one", () => {
    expect(envelopeEmoji({ categoryIds: ["tag", "missing"] }, categories)).toBeNull();
    expect(envelopeEmoji({ categoryIds: [] }, categories)).toBeNull();
  });
});

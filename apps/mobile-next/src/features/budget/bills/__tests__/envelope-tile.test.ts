import { envelopeTileIcon } from "../envelope-tile";

describe("envelopeTileIcon", () => {
  const icons = new Map([
    ["car", "🚗"],
    ["tagged", "tag"],
    ["drawn", "groceries"],
  ]);

  it("uses the Category's emoji or Trove icon", () => {
    expect(envelopeTileIcon({ group: "bills", categoryIds: ["car"] }, icons)).toBe("🚗");
    expect(envelopeTileIcon({ group: "bills", categoryIds: ["drawn"] }, icons)).toBe("groceries");
  });

  it("falls back to the group's icon for legacy slugs and missing categories", () => {
    expect(envelopeTileIcon({ group: "bills", categoryIds: ["tagged"] }, icons)).toBe("bills");
    expect(envelopeTileIcon({ group: "saving", categoryIds: [] }, icons)).toBe("savings");
  });
});

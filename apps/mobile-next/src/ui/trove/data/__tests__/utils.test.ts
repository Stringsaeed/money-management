import { isCategoryIconName, joinSpoken } from "../utils";

describe("isCategoryIconName", () => {
  it("recognises Trove category icons and rejects emoji and unknown names", () => {
    expect(isCategoryIconName("groceries")).toBe(true);
    expect(isCategoryIconName("🍕")).toBe(false);
    expect(isCategoryIconName("not-an-icon")).toBe(false);
    expect(isCategoryIconName("toString")).toBe(false);
  });
});

describe("joinSpoken", () => {
  it("skips missing parts", () => {
    expect(joinSpoken(["Fresh Market", undefined, "64 dollars"])).toBe("Fresh Market, 64 dollars");
  });
});

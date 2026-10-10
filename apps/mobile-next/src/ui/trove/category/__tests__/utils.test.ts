import { USER_COLOR_SWATCHES } from "../palette";
import {
  chunkRows,
  findSwatch,
  isSameColor,
  normalizeHex,
  resolveUserColor,
  USER_TINT_ALPHA,
  withAlpha,
} from "../utils";

describe("user colour helpers", () => {
  it("has the board's nine swatches", () => {
    expect(USER_COLOR_SWATCHES).toHaveLength(9);
    expect(USER_COLOR_SWATCHES[5]).toEqual({ name: "Orange", hex: "#EB6834" });
  });

  it("normalises short and lower-case hex, rejecting junk", () => {
    expect(normalizeHex("#eb6834")).toBe("#EB6834");
    expect(normalizeHex("#f60")).toBe("#FF6600");
    expect(normalizeHex("orange")).toBeNull();
    expect(normalizeHex("#EB68342E")).toBeNull();
  });

  it("appends the alpha byte", () => {
    expect(withAlpha("#EB6834", 0.18)).toBe("#EB68342E");
    expect(withAlpha("#EB6834", 0.25)).toBe("#EB683440");
    expect(withAlpha("#EB6834", 2)).toBe("#EB6834FF");
    expect(withAlpha("nope", 0.5)).toBeNull();
  });

  it("tints at 18% on paper and 25% on dark, ring at full strength", () => {
    expect(USER_TINT_ALPHA).toEqual({ light: 0.18, dark: 0.25 });
    expect(resolveUserColor("#3E4CF0", "light")).toEqual({ tint: "#3E4CF02E", ring: "#3E4CF0" });
    expect(resolveUserColor("#3E4CF0", "dark")).toEqual({ tint: "#3E4CF040", ring: "#3E4CF0" });
    expect(resolveUserColor("bad", "light")).toBeNull();
  });

  it("compares colours ignoring case and finds palette swatches", () => {
    expect(isSameColor("#eb6834", "#EB6834")).toBe(true);
    expect(isSameColor("#EB6834", "#3E4CF0")).toBe(false);
    expect(isSameColor(null, "#EB6834")).toBe(false);
    expect(findSwatch("#14a3a3")?.name).toBe("Teal");
    expect(findSwatch("#000000")).toBeUndefined();
  });

  it("chunks into rows with a short last row", () => {
    expect(chunkRows([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });
});

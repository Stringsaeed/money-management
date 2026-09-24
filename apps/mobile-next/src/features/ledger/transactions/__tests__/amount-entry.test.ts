import {
  amountDisplayParts,
  amountFontSize,
  amountSymbol,
  applyAmountKey,
  normalizeAmountEntry,
  type AmountKey,
} from "../amount-entry";

const type = (keys: readonly AmountKey[], fractionDigits = 2) =>
  keys.reduce((amount, key) => applyAmountKey(amount, key, fractionDigits), "");

describe("amount entry", () => {
  it("builds decimals and caps the fraction at the currency precision", () => {
    expect(type(["1", "2", ".", "5", "0", "9"])).toBe("12.50");
  });

  it("replaces a leading zero and prefixes a bare decimal point", () => {
    expect(type(["0", "7"])).toBe("7");
    expect(type([".", "5"])).toBe("0.5");
  });

  it("ignores the decimal key for zero-decimal currencies", () => {
    expect(type(["1", ".", "5"], 0)).toBe("15");
  });

  it("deletes back to an empty entry", () => {
    expect(type(["0", ".", "delete", "delete"])).toBe("");
    expect(type(["4", ".", "2", "delete"])).toBe("4.");
  });

  it("formats display parts with grouping and pending fraction digits", () => {
    expect(amountDisplayParts("1234.5", 2)).toEqual({
      whole: "1,234",
      hasDecimal: true,
      typedFraction: "5",
      pendingFraction: "0",
    });
    expect(amountDisplayParts("", 2).whole).toBe("0");
  });

  it("normalizes trailing decimals and empty entries for parsing", () => {
    expect(normalizeAmountEntry("12.")).toBe("12");
    expect(normalizeAmountEntry("")).toBe("0");
  });

  it("keeps short amounts at full size and shrinks long ones to a floor", () => {
    expect(amountFontSize(5)).toBe(64);
    expect(amountFontSize(14)).toBe(32);
    expect(amountFontSize(40)).toBe(28);
  });

  it("draws riyal and dirham as glyphs and other currencies as text", () => {
    expect(amountSymbol("SAR")).toEqual({ kind: "glyph", name: "riyal" });
    expect(amountSymbol("AED")).toEqual({ kind: "glyph", name: "dirham" });
    expect(amountSymbol("USD")).toEqual({ kind: "text", label: "$" });
    expect(amountSymbol("JPY")).toEqual({ kind: "text", label: "¥" });
    expect(amountSymbol(null)).toEqual({ kind: "none" });
  });
});

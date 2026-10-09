import { amountParts, MINUS } from "../amount-parts";

describe("amountParts", () => {
  it("puts the minus before the currency and splits cents", () => {
    expect(amountParts(-6420, "USD")).toEqual({
      sign: MINUS,
      glyph: null,
      symbol: "$",
      whole: "64",
      fraction: ".20",
    });
  });

  it("groups whole digits", () => {
    expect(amountParts(1248050, "EUR")).toMatchObject({
      symbol: "€",
      whole: "12,480",
      fraction: ".50",
    });
  });

  it("draws AED and SAR as glyphs, not text", () => {
    expect(amountParts(100, "AED")).toMatchObject({ glyph: "dirham", symbol: "" });
    expect(amountParts(100, "SAR")).toMatchObject({ glyph: "riyal", symbol: "" });
  });

  it("gives yen no decimals", () => {
    expect(amountParts(184300, "JPY")).toMatchObject({ whole: "184,300", fraction: "" });
  });

  it("prints plus only when asked, and never on zero", () => {
    expect(amountParts(132000, "USD").sign).toBe("");
    expect(amountParts(132000, "USD", "always").sign).toBe("+");
    expect(amountParts(0, "USD", "always").sign).toBe("");
    expect(amountParts(-100, "USD", "never").sign).toBe("");
  });
});

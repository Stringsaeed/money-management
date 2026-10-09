import { amountAccessibilityLabel, amountParts, MINUS } from "../amount-parts";

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

describe("amountParts on Hermes", () => {
  it("splits whole digits and cents without formatToParts", () => {
    // Hermes has no Intl.NumberFormat.prototype.formatToParts; the split must not depend on it.
    const original = Intl.NumberFormat.prototype.formatToParts;
    Object.defineProperty(Intl.NumberFormat.prototype, "formatToParts", {
      configurable: true,
      value: undefined,
    });
    try {
      expect(amountParts(-1248050, "USD")).toMatchObject({
        sign: MINUS,
        whole: "12,480",
        fraction: ".50",
      });
    } finally {
      Object.defineProperty(Intl.NumberFormat.prototype, "formatToParts", {
        configurable: true,
        value: original,
      });
    }
  });
});

describe("amountAccessibilityLabel", () => {
  it("speaks the sign, digits and ISO code", () => {
    expect(amountAccessibilityLabel(-6420, "USD")).toBe("minus 64.20 USD");
    expect(amountAccessibilityLabel(184300, "JPY")).toBe("184,300 JPY");
  });
});

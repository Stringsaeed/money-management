import {
  centsToDecimalString,
  currencyAffixes,
  decimalStringToCents,
  formatCents,
} from "@/utils/currency";

describe("currency utils", () => {
  it("formats cents as localized currency", () => {
    expect(formatCents(1099, "USD")).toBe("$10.99");
    expect(formatCents(1099)).toBe("$10.99");
  });

  it("formats cents as a decimal string", () => {
    expect(centsToDecimalString(1099)).toBe("10.99");
  });

  it("parses decimal strings into cents", () => {
    expect(decimalStringToCents("10.99")).toBe(1099);
    expect(decimalStringToCents("1,099.50")).toBe(109950);
    expect(decimalStringToCents("$1,099.50 AED")).toBe(109950);
  });

  it("returns zero for invalid input", () => {
    expect(decimalStringToCents("hello")).toBe(0);
  });

  describe("currencyAffixes", () => {
    it("puts a leading symbol in the prefix", () => {
      expect(currencyAffixes("USD", "en-US")).toEqual({ prefix: "$", suffix: "" });
    });

    it("keeps a multi-letter code away from the number", () => {
      // The regression: handing "AED 32,200.00" to number-flow rendered it as
      // "A × 10³²²⁰⁰⁰⁰" because its fallback parser read the "E" as an exponent.
      const { prefix, suffix } = currencyAffixes("AED", "en-US");

      expect(prefix.trimEnd()).toBe("AED");
      expect(suffix).toBe("");
    });

    it("puts a trailing symbol in the suffix", () => {
      const { prefix, suffix } = currencyAffixes("EUR", "de-DE");

      expect(prefix).toBe("");
      expect(suffix.trimStart()).toBe("€");
    });

    it("defaults to USD", () => {
      expect(currencyAffixes(undefined, "en-US")).toEqual({ prefix: "$", suffix: "" });
    });

    it("falls back to a leading code when the formatters disagree", () => {
      const original = Intl.NumberFormat;
      // Force the zero-lookup to miss, exercising the defensive branch.
      class StubFormat {
        constructor(
          _locale: string | undefined,
          private options?: Intl.NumberFormatOptions,
        ) {}
        format() {
          return this.options?.style === "currency" ? "AED 0.00" : "nothing-alike";
        }
      }
      const stub = StubFormat as unknown as typeof Intl.NumberFormat;

      Object.defineProperty(Intl, "NumberFormat", { value: stub, configurable: true });
      try {
        expect(currencyAffixes("AED", "en-US")).toEqual({ prefix: "AED ", suffix: "" });
      } finally {
        Object.defineProperty(Intl, "NumberFormat", { value: original, configurable: true });
      }
    });
  });
});

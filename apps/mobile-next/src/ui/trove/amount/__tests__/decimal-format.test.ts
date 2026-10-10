import { decimalAmountAccessibilityLabel, decimalAmountParts, MINUS } from "../amount-parts";
import { formatDecimal, parseDecimalString } from "../decimal-format";

describe("parseDecimalString", () => {
  it.each([
    ["61240.18", false, "61240", "18"],
    ["-0.5", true, "0", "5"],
    [".5", false, "0", "5"],
    ["7.", false, "7", ""],
    ["000123.40", false, "123", "40"],
    ["+3", false, "3", ""],
  ])("parses %s", (input, negative, whole, fraction) => {
    expect(parseDecimalString(input)).toEqual({ negative, whole, fraction });
  });

  it.each(["", ".", "abc", "1e-7", "1,234.5", "1.2.3", "--1"])("rejects %j", (input) => {
    expect(parseDecimalString(input)).toBeNull();
  });
});

describe("formatDecimal", () => {
  it.each([
    // [value, whole, main, tail]
    ["61240.18", "61240", "18", ""],
    ["2412.07", "2412", "07", ""],
    ["2384.4", "2384", "40", ""],
    ["1", "1", "00", ""],
    ["1.005", "1", "01", ""],
    ["9.999", "10", "00", ""],
    ["0.1834", "0", "18", "34"],
    ["0.1830", "0", "18", "3"],
    ["0.5", "0", "50", ""],
    ["0.05", "0", "05", ""],
    ["0.00001842", "0", "00", "001842"],
    ["0.000018424", "0", "00", "001842"],
    ["0.000018426", "0", "00", "001843"],
    ["0.00099996", "0", "00", "1"],
    ["0.99996", "1", "00", ""],
    ["0.99994", "0", "99", "99"],
    ["0", "0", "00", ""],
    ["0.00", "0", "00", ""],
    ["0.0000", "0", "00", ""],
  ])("formats %s", (value, whole, main, tail) => {
    expect(formatDecimal(value)).toMatchObject({ whole, main, tail });
  });

  it("honours a custom significant count", () => {
    expect(formatDecimal("0.00001842", 2)).toMatchObject({ main: "00", tail: "0018" });
    expect(formatDecimal("0.00001842", 6)).toMatchObject({ main: "00", tail: "001842" });
    expect(formatDecimal("0.1834", 1)).toMatchObject({ main: "18", tail: "" });
    expect(formatDecimal("0.1834", 0)).toMatchObject({ main: "18", tail: "" });
  });

  it("is exact where floats are not", () => {
    // 0.1 + 0.2 style traps and values past 2^53 survive untouched.
    expect(formatDecimal("0.30000000000000004", 4)).toMatchObject({ main: "30", tail: "" });
    expect(formatDecimal("12345678901234567890.12")).toMatchObject({
      whole: "12345678901234567890",
      main: "12",
    });
  });

  it("supports currencies without minor units", () => {
    expect(formatDecimal("184300.6", 4, 0)).toMatchObject({ whole: "184301", main: "", tail: "" });
    expect(formatDecimal("0.0042", 4, 0)).toMatchObject({ main: "", tail: "0042" });
  });

  it("never reports a negative zero", () => {
    expect(formatDecimal("-0")?.negative).toBe(false);
    expect(formatDecimal("-0.00")?.negative).toBe(false);
    expect(formatDecimal("-0.00001842")?.negative).toBe(true);
    expect(formatDecimal("-61240.18")?.negative).toBe(true);
  });

  it("returns null for invalid input", () => {
    expect(formatDecimal("nope")).toBeNull();
  });
});

describe("decimalAmountParts", () => {
  it("groups whole digits and splits cents", () => {
    expect(decimalAmountParts("61240.18", "USD")).toEqual({
      sign: "",
      glyph: null,
      symbol: "$",
      whole: "61,240",
      fraction: ".18",
      tail: "",
    });
  });

  it("splits a sub-cent price into cents and faded tail", () => {
    expect(decimalAmountParts("0.00001842", "USD", "auto", 4)).toMatchObject({
      whole: "0",
      fraction: ".00",
      tail: "001842",
    });
    expect(decimalAmountParts("0.1834", "USD")).toMatchObject({ fraction: ".18", tail: "34" });
  });

  it("shows zero as 0.00", () => {
    expect(decimalAmountParts("0", "USD")).toMatchObject({ whole: "0", fraction: ".00", tail: "" });
  });

  it("applies the sign rules", () => {
    expect(decimalAmountParts("-12.5", "USD").sign).toBe(MINUS);
    expect(decimalAmountParts("-12.5", "USD", "never").sign).toBe("");
    expect(decimalAmountParts("12.5", "USD", "always").sign).toBe("+");
    expect(decimalAmountParts("0", "USD", "always").sign).toBe("");
  });

  it("gives yen no decimals unless the price is sub-unit", () => {
    expect(decimalAmountParts("184300", "JPY")).toMatchObject({ fraction: "", tail: "" });
    expect(decimalAmountParts("0.0042", "JPY")).toMatchObject({ fraction: ".", tail: "0042" });
  });

  it("falls back to zero for unparseable input", () => {
    expect(decimalAmountParts("oops", "USD")).toMatchObject({ whole: "0", fraction: ".00" });
  });
});

describe("decimalAmountAccessibilityLabel", () => {
  it("speaks every kept digit", () => {
    expect(decimalAmountAccessibilityLabel("61240.18", "USD")).toBe("61,240.18 USD");
    expect(decimalAmountAccessibilityLabel("0.1834", "USD")).toBe("0.1834 USD");
    expect(decimalAmountAccessibilityLabel("0.00001842", "USD")).toBe("0.00001842 USD");
    expect(decimalAmountAccessibilityLabel("-2.5", "USD")).toBe("minus 2.50 USD");
  });
});

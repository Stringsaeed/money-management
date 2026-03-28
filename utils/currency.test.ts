import { centsToDecimalString, decimalStringToCents, formatCents } from "@/utils/currency";

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
});

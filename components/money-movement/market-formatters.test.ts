import { formatPrice, formatSignedPercent } from "@/components/money-movement/market-formatters";

describe("market formatters", () => {
  it("formats prices with market-friendly precision", () => {
    expect(formatPrice(null, "USD")).toBe("--");
    expect(formatPrice(216.61, "USD")).toBe("$216.61");
    expect(formatPrice(1.4337, "USD")).toBe("$1.4337");
  });

  it("formats signed percentages", () => {
    expect(formatSignedPercent(null)).toBe("--");
    expect(formatSignedPercent(4)).toBe("+4.00%");
    expect(formatSignedPercent(-0.42)).toBe("-0.42%");
  });
});

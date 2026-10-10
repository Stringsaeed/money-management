import { decimalPrice } from "../market-price";

describe("decimalPrice", () => {
  it("keeps cents on large prices without float noise", () => {
    expect(decimalPrice(61240.18)).toBe("61240.18");
    expect(decimalPrice(0.1 + 0.2)).toBe("0.3");
  });

  it("keeps sub-cent digits and trims trailing zeros", () => {
    expect(decimalPrice(0.1834)).toBe("0.1834");
    expect(decimalPrice(0.00001842)).toBe("0.00001842");
  });

  it("drops the fraction for whole prices", () => {
    expect(decimalPrice(100)).toBe("100");
    expect(decimalPrice(0)).toBe("0");
  });
});

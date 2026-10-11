import { describe, expect, it } from "@jest/globals";

import { compactAmount, plainAmount, wholeAmount } from "../home-money";

describe("home money labels", () => {
  it("prints signed figures without a currency sign", () => {
    expect(plainAmount(-185_000, "AED", "always")).toBe("−1,850.00");
    expect(plainAmount(1_200_000, "AED", "always")).toBe("+12,000.00");
  });

  it("drops zero decimals but keeps ones that carry value", () => {
    expect(compactAmount(198_800, "AED")).toBe("1,988");
    expect(compactAmount(-7_550, "AED")).toBe("75.50");
  });

  it("prints whole units for markers", () => {
    expect(wholeAmount(-132_050, "AED")).toBe("1,320");
  });
});

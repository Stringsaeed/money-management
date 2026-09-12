import { describe, expect, it } from "@jest/globals";

import { formatPrice } from "./market-formatters";

describe("formatPrice", () => {
  it("formats USD prices with en-US currency style", () => {
    expect(formatPrice(null, "USD")).toBe("--");
    expect(formatPrice(12.3, "USD")).toBe("$12.3000");
    expect(formatPrice(150, "USD")).toBe("$150.00");
  });
});

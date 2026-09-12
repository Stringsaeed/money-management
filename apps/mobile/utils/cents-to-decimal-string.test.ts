import { describe, expect, it } from "@jest/globals";

import { centsToDecimalString } from "./currency";

describe("centsToDecimalString", () => {
  it("formats integer cents as a fixed two-decimal string", () => {
    expect(centsToDecimalString(0)).toBe("0.00");
    expect(centsToDecimalString(1099)).toBe("10.99");
    expect(centsToDecimalString(-250)).toBe("-2.50");
  });
});

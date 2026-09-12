import { describe, expect, it } from "@jest/globals";

import { decimalStringToCents } from "./currency";

describe("decimalStringToCents", () => {
  it("parses decimal money strings into integer cents", () => {
    expect(decimalStringToCents("10.99")).toBe(1099);
    expect(decimalStringToCents("1,099.50")).toBe(109950);
    expect(decimalStringToCents("$1,099.50 AED")).toBe(109950);
    expect(decimalStringToCents("hello")).toBe(0);
  });
});

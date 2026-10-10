import { describe, expect, it } from "@jest/globals";

import { signedMinor } from "../home-display";

describe("signedMinor", () => {
  it("makes spending negative and keeps money in and transfers positive", () => {
    expect(signedMinor("expense", 1250)).toBe(-1250);
    expect(signedMinor("income", 1250)).toBe(1250);
    expect(signedMinor("transfer", 1250)).toBe(1250);
  });

  it("does not double-negate an already signed expense", () => {
    expect(signedMinor("expense", -1250)).toBe(-1250);
  });
});

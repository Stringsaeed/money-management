import { noSafeToSpendReason } from "../home-model";

describe("noSafeToSpendReason", () => {
  it("is neutral at exactly zero, an over message below zero, and absent above", () => {
    expect(noSafeToSpendReason(0)).toBe("Everything is planned");
    expect(noSafeToSpendReason(-1)).toBe("You've planned or spent more than you have");
    expect(noSafeToSpendReason(100)).toBeNull();
  });
});

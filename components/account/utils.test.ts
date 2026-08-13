import { accountDisplayIcon, isCustomAccountIcon } from "@/components/account/utils";

describe("account display icon", () => {
  it("treats emojis as custom icons and SF Symbol names as legacy defaults", () => {
    expect(isCustomAccountIcon("🏦")).toBe(true);
    expect(isCustomAccountIcon("banknote.fill")).toBe(false);
  });

  it("prefers a stored emoji and falls back to the type emoji", () => {
    expect(accountDisplayIcon({ icon: "💎", type: "checking" })).toBe("💎");
    expect(accountDisplayIcon({ icon: "banknote.fill", type: "savings" })).toBe("🏦");
  });
});

import { describe, expect, it } from "@jest/globals";

import { accountDisplayIcon } from "./utils";

describe("accountDisplayIcon", () => {
  it("prefers custom icons and otherwise uses account-type emoji", () => {
    expect(accountDisplayIcon({ icon: "🚀", type: "checking" })).toBe("🚀");
    expect(accountDisplayIcon({ icon: "creditcard.fill", type: "checking" })).toBe("💳");
  });
});

import { describe, expect, it } from "@jest/globals";

import { getCurrencyDisplayName } from "./account-currency-utils";

describe("getCurrencyDisplayName", () => {
  it("resolves en display names for common ISO codes", () => {
    expect(getCurrencyDisplayName("USD", "en")).toMatch(/dollar/i);
    expect(getCurrencyDisplayName("EUR", "en")).toMatch(/euro/i);
  });
});

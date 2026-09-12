import { describe, expect, it } from "@jest/globals";

import { accountLifecyclePeriod } from "./account-ledger-date";

describe("accountLifecyclePeriod", () => {
  it("returns yyyy-MM for a valid local Ledger Date", () => {
    expect(accountLifecyclePeriod("2026-03-01")).toBe("2026-03");
  });

  it("rejects malformed Ledger Dates", () => {
    expect(() => accountLifecyclePeriod("03/01/2026")).toThrow(/Ledger Date/);
    expect(() => accountLifecyclePeriod("2026-13-01")).toThrow(/Ledger Date/);
  });
});

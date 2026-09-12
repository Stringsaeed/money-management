import { describe, expect, it } from "@jest/globals";

import {
  addMoney,
  periodForLocalDate,
  requireCurrency,
  requireDistinctAccountIds,
  requireMinorUnits,
  requirePeriod,
} from "./validation";

describe("requireMinorUnits / addMoney", () => {
  it("accepts safe integer minor units and sums them", () => {
    expect(() => requireMinorUnits(125, "USD")).not.toThrow();
    expect(addMoney(100, 25, "USD")).toBe(125);
  });

  it("rejects non-integer money", () => {
    expect(() => requireMinorUnits(1.5, "USD")).toThrow(/safe integer/);
  });
});

describe("requireCurrency / requireDistinctAccountIds", () => {
  it("requires ISO-4217 style currency codes", () => {
    expect(requireCurrency("USD")).toBe("USD");
    expect(() => requireCurrency("usd")).toThrow(/three-letter/);
  });

  it("requires at least one distinct non-empty Funding Account id", () => {
    expect(requireDistinctAccountIds(["a1", "a2"])).toEqual(["a1", "a2"]);
    expect(() => requireDistinctAccountIds([])).toThrow(/at least one/);
    expect(() => requireDistinctAccountIds(["a1", "a1"])).toThrow(/distinct/);
    expect(() => requireDistinctAccountIds(["a1", ""])).toThrow(/distinct/);
  });
});

describe("periodForLocalDate / requirePeriod", () => {
  it("derives yyyy-MM from a valid local Ledger Date", () => {
    expect(periodForLocalDate("2026-09-12")).toBe("2026-09");
    expect(requirePeriod("2026-09")).toBe("2026-09");
  });

  it("rejects malformed dates and periods", () => {
    expect(() => periodForLocalDate("2026-9-12")).toThrow(/Ledger Date/);
    expect(() => requirePeriod("2026-9")).toThrow(/yyyy-MM/);
  });
});

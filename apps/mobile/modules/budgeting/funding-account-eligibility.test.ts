import { describe, expect, it } from "@jest/globals";

import {
  isDefaultFundingAccountType,
  isEligibleFundingAccountType,
} from "./funding-account-eligibility";

describe("isEligibleFundingAccountType", () => {
  it("allows checking, savings, cash, and other", () => {
    for (const type of ["checking", "savings", "cash", "other"] as const) {
      expect(isEligibleFundingAccountType(type)).toBe(true);
    }
  });

  it("rejects credit and liability account types", () => {
    expect(isEligibleFundingAccountType("credit_card")).toBe(false);
    expect(isEligibleFundingAccountType("loan")).toBe(false);
    expect(isEligibleFundingAccountType("")).toBe(false);
  });
});

describe("isDefaultFundingAccountType", () => {
  it("defaults checking/savings/cash but not other", () => {
    expect(isDefaultFundingAccountType("checking")).toBe(true);
    expect(isDefaultFundingAccountType("other")).toBe(false);
  });
});

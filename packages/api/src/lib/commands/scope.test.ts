import { describe, expect, it } from "vitest";

import { personalLedgerId } from "@trove/protocol";

import { bindLedgerScope } from "./scope";

describe("bindLedgerScope", () => {
  it("binds a personal scope to personal:${userId} with null householdId", () => {
    const scope = { type: "personal" as const, userId: "user_01" };
    expect(bindLedgerScope(scope)).toEqual({
      scope,
      ledgerId: personalLedgerId("user_01"),
      householdId: null,
    });
    expect(bindLedgerScope(scope).ledgerId).toBe("personal:user_01");
  });

  it("binds an organization scope to the organization id as ledger and household", () => {
    const scope = { type: "organization" as const, organizationId: "org_01" };
    expect(bindLedgerScope(scope)).toEqual({
      scope,
      ledgerId: "org_01",
      householdId: "org_01",
    });
  });
});

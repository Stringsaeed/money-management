import { describe, expect, it } from "vitest";

import { ledgerReadFields, ledgerReadInput } from "./ledger-read-input";

describe("ledgerReadFields", () => {
  it("accepts an empty object and optional scope or householdId alone", () => {
    expect(ledgerReadFields.safeParse({}).success).toBe(true);
    expect(ledgerReadFields.safeParse({ scope: { type: "personal" } }).success).toBe(true);
    expect(ledgerReadFields.safeParse({ householdId: "hh_legacy" }).success).toBe(true);
    expect(
      ledgerReadFields.safeParse({
        householdId: "hh_1",
        scope: { type: "organization", organizationId: "org_1" },
      }).success,
    ).toBe(true);
  });

  it("rejects blank householdId and unknown scope type", () => {
    expect(ledgerReadFields.safeParse({ householdId: "" }).success).toBe(false);
    expect(ledgerReadFields.safeParse({ scope: { type: "shared" } }).success).toBe(false);
  });
});

describe("ledgerReadInput", () => {
  it("accepts personal or organization scope", () => {
    expect(ledgerReadInput.safeParse({ scope: { type: "personal" } }).success).toBe(true);
    expect(
      ledgerReadInput.safeParse({
        scope: { type: "organization", organizationId: "hh_1" },
      }).success,
    ).toBe(true);
  });

  it("accepts legacy householdId alone", () => {
    expect(ledgerReadInput.safeParse({ householdId: "hh_legacy" }).success).toBe(true);
  });

  it("rejects an empty object that names no ledger", () => {
    const parsed = ledgerReadInput.safeParse({});
    expect(parsed.success).toBe(false);
    if (parsed.success) return;
    expect(parsed.error.issues[0]?.path).toEqual(["scope"]);
  });
});

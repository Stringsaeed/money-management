import { describe, expect, it } from "vitest";

import { ledgerReadInput } from "./ledger-read-input";

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

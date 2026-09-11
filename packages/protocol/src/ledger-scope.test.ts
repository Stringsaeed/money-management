import assert from "node:assert/strict";
import test from "node:test";

import {
  isPersonalLedgerId,
  ledgerIdForScope,
  organizationLedgerId,
  parseLedgerId,
  personalLedgerId,
  personalLedgerOwner,
  sameLedgerScope,
} from "./ledger-scope.ts";

test("a Personal Ledger id names its owning User", () => {
  assert.equal(personalLedgerId("user_01"), "personal:user_01");
  assert.equal(ledgerIdForScope({ type: "personal", userId: "user_01" }), "personal:user_01");
  assert.equal(personalLedgerOwner("personal:user_01"), "user_01");
  assert.equal(isPersonalLedgerId("personal:user_01"), true);
});

test("an Organization Ledger id is the organization id itself", () => {
  assert.equal(organizationLedgerId("org_01"), "org_01");
  assert.equal(ledgerIdForScope({ type: "organization", organizationId: "org_01" }), "org_01");
  assert.equal(personalLedgerOwner("org_01"), null);
  assert.equal(isPersonalLedgerId("org_01"), false);
});

test("parsing a ledger id round-trips both scopes", () => {
  for (const scope of [
    { type: "personal", userId: "user_01" },
    { type: "organization", organizationId: "household-1" },
  ] as const) {
    assert.deepEqual(parseLedgerId(ledgerIdForScope(scope)), scope);
  }
});

test("parsing rejects ids that name no owner", () => {
  assert.equal(parseLedgerId(""), null);
  assert.equal(parseLedgerId("personal:"), null);
});

test("scopes match only when they address the same ledger", () => {
  assert.equal(
    sameLedgerScope({ type: "personal", userId: "a" }, { type: "personal", userId: "a" }),
    true,
  );
  assert.equal(
    sameLedgerScope({ type: "personal", userId: "a" }, { type: "personal", userId: "b" }),
    false,
  );
  assert.equal(
    sameLedgerScope(
      { type: "organization", organizationId: "household-1" },
      { type: "organization", organizationId: "household-2" },
    ),
    false,
  );
});

import assert from "node:assert/strict";
import test from "node:test";

import { commandLedgerId } from "../dist/command.js";

test("commandLedgerId returns personal ledger id for personal scope", () => {
  assert.equal(
    commandLedgerId({ scope: { type: "personal" } }, "user_01"),
    "personal:user_01",
  );
});

test("commandLedgerId returns organization id for organization scope", () => {
  assert.equal(
    commandLedgerId(
      { scope: { type: "organization", organizationId: "org_01" } },
      "user_01",
    ),
    "org_01",
  );
});

test("commandLedgerId returns householdId when scope is omitted", () => {
  assert.equal(commandLedgerId({ householdId: "hh_01" }, "user_01"), "hh_01");
});

test("commandLedgerId returns null when scope cannot be resolved", () => {
  assert.equal(commandLedgerId({}, "user_01"), null);
});

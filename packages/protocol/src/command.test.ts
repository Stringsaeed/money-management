import assert from "node:assert/strict";
import test from "node:test";

import {
  COMMAND_KINDS,
  HOUSEHOLD_ROLES,
  isCommandKind,
  isHouseholdRole,
} from "../dist/command.js";

test("COMMAND_KINDS lists every wire command kind in stable order", () => {
  assert.deepEqual([...COMMAND_KINDS], [
    "account.create",
    "account.update",
    "account.archive",
    "category.create",
    "category.update",
    "category.archive",
    "transaction.create",
    "transaction.edit",
    "transaction.remove",
    "recurring.change",
    "budget.configure",
    "assignment.commit",
    "assignment.correct",
    "refund.link",
    "import_bundle",
  ]);
});

test("COMMAND_KINDS excludes retired member.role.change", () => {
  assert.equal(COMMAND_KINDS.includes("member.role.change"), false);
});

test("isHouseholdRole accepts WorkOS role slugs Trove authorizes", () => {
  assert.deepEqual(HOUSEHOLD_ROLES, ["admin", "member", "viewer"]);
  for (const role of HOUSEHOLD_ROLES) {
    assert.equal(isHouseholdRole(role), true);
  }
});

test("isHouseholdRole rejects unknown role slugs", () => {
  assert.equal(isHouseholdRole("owner"), false);
  assert.equal(isHouseholdRole("billing_manager"), false);
  assert.equal(isHouseholdRole(""), false);
  assert.equal(isHouseholdRole("Admin"), false);
});

test("isCommandKind accepts every registered command kind", () => {
  assert.ok(COMMAND_KINDS.includes("import_bundle"));
  for (const kind of COMMAND_KINDS) {
    assert.equal(isCommandKind(kind), true);
  }
});

test("isCommandKind rejects unknown or retired kinds", () => {
  assert.equal(isCommandKind("member.role.change"), false);
  assert.equal(isCommandKind("account.delete"), false);
  assert.equal(isCommandKind(""), false);
  assert.equal(isCommandKind("IMPORT_BUNDLE"), false);
});

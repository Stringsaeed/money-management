import assert from "node:assert/strict";
import test from "node:test";

import { resolveCommandScope } from "../dist/command.js";

test("resolveCommandScope maps personal scope to the authenticated user", () => {
  assert.deepEqual(
    resolveCommandScope({ scope: { type: "personal" } }, "user_01"),
    { type: "personal", userId: "user_01" },
  );
});

test("resolveCommandScope maps organization scope to the organization id", () => {
  assert.deepEqual(
    resolveCommandScope(
      { scope: { type: "organization", organizationId: "org_01" } },
      "user_01",
    ),
    { type: "organization", organizationId: "org_01" },
  );
});

test("resolveCommandScope falls back to householdId as organization scope", () => {
  assert.deepEqual(resolveCommandScope({ householdId: "hh_01" }, "user_01"), {
    type: "organization",
    organizationId: "hh_01",
  });
});

test("resolveCommandScope returns null when neither scope nor household is named", () => {
  assert.equal(resolveCommandScope({}, "user_01"), null);
});

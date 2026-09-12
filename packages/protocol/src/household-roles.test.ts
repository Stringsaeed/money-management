import assert from "node:assert/strict";
import test from "node:test";

import { HOUSEHOLD_ROLES } from "../dist/command.js";

test("HOUSEHOLD_ROLES locks admin/member/viewer vocabulary", () => {
  assert.deepEqual(HOUSEHOLD_ROLES, ["admin", "member", "viewer"]);
});

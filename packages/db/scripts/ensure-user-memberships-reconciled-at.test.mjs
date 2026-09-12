import assert from "node:assert/strict";
import test from "node:test";

import { isAlterPermissionDenied } from "./ensure-user-memberships-reconciled-at-lib.mjs";

test("isAlterPermissionDenied matches Postgres 42501", () => {
  assert.equal(
    isAlterPermissionDenied(
      Object.assign(new Error("must be owner of table user"), { code: "42501" }),
    ),
    true,
  );
  assert.equal(
    isAlterPermissionDenied(Object.assign(new Error("undefined column"), { code: "42703" })),
    false,
  );
  assert.equal(isAlterPermissionDenied(new Error("nope")), false);
});

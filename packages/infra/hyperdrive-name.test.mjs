import assert from "node:assert/strict";
import test from "node:test";

import { hyperdriveNameForStage } from "./hyperdrive-name.mjs";

test("keeps the production Hyperdrive name stable", () => {
  assert.equal(hyperdriveNameForStage("prod"), "trove-ledger-fresh");
});

test("keeps non-production names valid and within Cloudflare's limit", () => {
  for (const stage of ["dev_saeed", "z2_verify_d844073", "a".repeat(100), "////"]) {
    const name = hyperdriveNameForStage(stage);
    assert.match(name, /^[a-z0-9-]+$/);
    assert.ok(name.length <= 32, `${name} is longer than 32 characters`);
    assert.notEqual(name, "trove-ledger-fresh");
  }
});

test("uses a 52-bit digest of the original stage", () => {
  assert.notEqual(hyperdriveNameForStage("foo/bar"), hyperdriveNameForStage("foo_bar"));
  assert.notEqual(
    hyperdriveNameForStage(`same-prefix-${"a".repeat(40)}`),
    hyperdriveNameForStage(`same-prefix-${"b".repeat(40)}`),
  );
  assert.notEqual(
    hyperdriveNameForStage("same-chku22t0sv34gv"),
    hyperdriveNameForStage("same-1sha4dak82bsbl"),
  );
  assert.equal(hyperdriveNameForStage("dev_saeed"), hyperdriveNameForStage("dev_saeed"));
});

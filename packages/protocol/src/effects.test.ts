import assert from "node:assert/strict";
import test from "node:test";

import { EFFECT_TAGS, coversEffects } from "./effects.ts";

test("EFFECT_TAGS lists every cache-invalidation effect tag", () => {
  assert.deepEqual([...EFFECT_TAGS], [
    "rules",
    "upcoming",
    "ledger",
    "balances",
    "summaries",
    "envelopes",
    "assignments",
    "projections",
    "members",
  ]);
});

test("EFFECT_TAGS membership is unique and excludes unknown tags", () => {
  const tags = EFFECT_TAGS as readonly string[];
  assert.equal(new Set(tags).size, tags.length);
  assert.equal(tags.includes("unknown"), false);
  assert.equal(tags.includes("activity"), false);
});

test("coversEffects is true when subset is empty or fully included", () => {
  assert.equal(coversEffects(["ledger", "balances"], []), true);
  assert.equal(coversEffects(["ledger", "balances", "members"], ["ledger", "members"]), true);
  assert.equal(coversEffects([...EFFECT_TAGS], ["rules", "projections"]), true);
});

test("coversEffects is false when any subset tag is missing", () => {
  assert.equal(coversEffects(["ledger"], ["ledger", "balances"]), false);
  assert.equal(coversEffects(["members"], ["rules"]), false);
  assert.equal(coversEffects([], ["upcoming"]), false);
});

test("coversEffects treats coverage as unordered and allows extras", () => {
  const effects = ["assignments", "envelopes", "ledger"] as const;
  assert.equal(coversEffects(effects, ["ledger", "envelopes"]), true);
  assert.equal(coversEffects(effects, ["envelopes", "ledger", "assignments"]), true);
});

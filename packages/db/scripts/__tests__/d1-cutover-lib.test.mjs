import assert from "node:assert/strict";
import test from "node:test";

import { CUTOVER_TABLES, digestRows, stableStringify, transformRow } from "../d1-cutover-lib.mjs";

test("transforms D1 scalar representations for Postgres", () => {
  const transformed = transformRow(
    {
      id: "row-1",
      active: 1,
      created_at: 1_788_810_000_123,
      payload: '{"b":2,"a":1}',
    },
    [
      { name: "id", dataType: "text" },
      { name: "active", dataType: "boolean" },
      { name: "created_at", dataType: "timestamp with time zone" },
      { name: "payload", dataType: "jsonb" },
    ],
  );

  assert.equal(transformed.id, "row-1");
  assert.equal(transformed.active, true);
  assert.equal(transformed.created_at.getTime(), 1_788_810_000_123);
  assert.deepEqual(transformed.payload, { a: 1, b: 2 });
});

test("synthesizes globally stable IDs for PowerSync-expanded tables", () => {
  const workspace = CUTOVER_TABLES.find(({ name }) => name === "budget_workspaces");
  assert.ok(workspace?.id);
  assert.equal(
    workspace.id({ household_id: "household-1", currency: "USD" }),
    "migration:workspace:household-1:USD",
  );
});

test("row digests ignore object key and row order", () => {
  const first = [
    { id: "b", payload: { z: 2, a: 1 } },
    { id: "a", active: true },
  ];
  const second = [
    { active: true, id: "a" },
    { payload: { a: 1, z: 2 }, id: "b" },
  ];
  assert.equal(digestRows(first), digestRows(second));
  assert.equal(stableStringify({ z: 2, a: 1 }), '{"a":1,"z":2}');
});

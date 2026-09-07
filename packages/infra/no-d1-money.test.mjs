import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const stack = readFileSync(new URL("./alchemy.run.ts", import.meta.url), "utf8");

test("ships the money Worker without a D1 resource or binding", () => {
  assert.doesNotMatch(stack, /Cloudflare\.D1|D1Database|migrationsDir|\bD1\s*:/);
  assert.match(stack, /HYPERDRIVE_FRESH:\s*hd/);
});

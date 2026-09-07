import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { parse } from "yaml";

const source = readFileSync(new URL("./sync-streams.yaml", import.meta.url), "utf8");
const config = parse(source);

test("uses Sync Streams edition 3 and an eager membership stream", () => {
  assert.equal(config.config.edition, 3);
  assert.equal(config.streams.memberships.auto_subscribe, true);
  assert.equal(config.streams.memberships.priority, 1);
  assert.match(config.streams.memberships.query, /FROM membership/);
  assert.match(config.streams.memberships.query, /user_id = auth\.user_id\(\)/);
});

test("guards every household query by the subscription and signed-in membership", () => {
  const stream = config.streams.household_ledger;
  assert.equal(stream.auto_subscribe, undefined);
  assert.equal(stream.accept_potentially_dangerous_queries, true);
  assert.equal(stream.queries.length, 3);

  for (const query of stream.queries) {
    assert.match(query, /household_id = subscription\.parameter\('household_id'\)/);
    assert.match(query, /SELECT household_id\s+FROM membership/);
    assert.match(query, /user_id = auth\.user_id\(\)/);
  }
});

test("keeps private accounts and their transactions visible only to their owner", () => {
  const [accounts, categories, transactions] = config.streams.household_ledger.queries;
  assert.match(accounts, /FROM accounts/);
  assert.match(accounts, /visibility = 'public' OR owner_user_id = auth\.user_id\(\)/);
  assert.match(categories, /FROM categories/);
  assert.match(transactions, /FROM transactions/);
  assert.match(transactions, /account_id IN/);
  assert.match(transactions, /to_account_id IS NULL OR to_account_id IN/);
  assert.match(transactions, /visibility = 'public' OR owner_user_id = auth\.user_id\(\)/g);
});

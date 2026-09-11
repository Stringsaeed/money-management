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

test("streams the Personal Ledger eagerly, scoped by the ledger's owner", () => {
  const stream = config.streams.personal_ledger;
  const tables = [
    "accounts",
    "categories",
    "transactions",
    "budget_workspaces",
    "envelopes",
    "category_mappings",
    "funding_memberships",
    "rollover_settings",
    "assignments",
    "refund_links",
    "recurring_rules",
    "recurring_occurrences",
  ];
  assert.equal(stream.auto_subscribe, true);
  assert.equal(stream.priority, 2);
  assert.equal(stream.queries.length, tables.length);

  for (const [index, table] of tables.entries()) {
    const query = stream.queries[index];
    assert.match(query, new RegExp(`FROM ${table}`));
    assert.match(query, /ledger_id IN/);
    assert.match(query, /SELECT id\s+FROM ledger/);
    assert.match(query, /personal_user_id = auth\.user_id\(\)/);
    // No subscription parameter: a User cannot ask for someone else's ledger.
    assert.doesNotMatch(query, /subscription\.parameter/);
  }
});

test("keeps private-account filters on Personal recurring streams", () => {
  const [rules, occurrences] = config.streams.personal_ledger.queries.slice(-2);
  assert.match(rules, /FROM recurring_rules/);
  assert.match(occurrences, /FROM recurring_occurrences/);
  for (const query of [rules, occurrences]) {
    assert.match(query, /visibility = 'public' OR owner_user_id = auth\.user_id\(\)/);
    assert.match(query, /account_id IS NULL OR account_id IN/);
    assert.match(query, /to_account_id IS NULL OR to_account_id IN/);
  }
  assert.match(occurrences, /rule_id IN/);
});

test("every Household stream denies inactive memberships and unknown role slugs", () => {
  const householdStreams = ["household_ledger", "household_budget", "household_recurring"];
  for (const name of householdStreams) {
    for (const query of config.streams[name].queries) {
      assert.match(
        query,
        /SELECT household_id FROM membership\s+WHERE user_id = auth\.user_id\(\)\s+AND status = 'active'\s+AND role IN \('admin', 'member', 'viewer'\)/,
        `${name} query gates on an active, known-role membership`,
      );
    }
  }
});

test("keeps the Personal Ledger and Household streams from bleeding into each other", () => {
  for (const query of config.streams.personal_ledger.queries) {
    assert.doesNotMatch(query, /household_id/);
  }
  for (const query of config.streams.household_ledger.queries) {
    assert.doesNotMatch(query, /personal_user_id/);
  }
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

test("streams every Household Account and Transaction to every active member", () => {
  const [accounts, categories, transactions] = config.streams.household_ledger.queries;
  assert.match(accounts, /FROM accounts/);
  assert.match(categories, /FROM categories/);
  assert.match(transactions, /FROM transactions/);
  for (const query of [accounts, transactions]) {
    assert.doesNotMatch(query, /visibility/);
    assert.doesNotMatch(query, /owner_user_id/);
  }
});

test("publishes every budget table through a membership-guarded household stream", () => {
  const stream = config.streams.household_budget;
  const tables = [
    "budget_workspaces",
    "envelopes",
    "category_mappings",
    "funding_memberships",
    "rollover_settings",
    "assignments",
    "refund_links",
  ];
  assert.equal(stream.accept_potentially_dangerous_queries, true);
  assert.equal(stream.queries.length, tables.length);
  for (const [index, table] of tables.entries()) {
    const query = stream.queries[index];
    assert.match(query, new RegExp(`FROM ${table}`));
    assert.match(query, /household_id = subscription\.parameter\('household_id'\)/);
    assert.match(query, /SELECT household_id\s+FROM membership/);
    assert.match(query, /user_id = auth\.user_id\(\)/);
  }
});

test("publishes every Household recurring Rule and Occurrence to active members", () => {
  const stream = config.streams.household_recurring;
  assert.equal(stream.accept_potentially_dangerous_queries, true);
  assert.equal(stream.queries.length, 2);
  for (const query of stream.queries) {
    assert.match(query, /household_id = subscription\.parameter\('household_id'\)/);
    assert.match(query, /SELECT household_id\s+FROM membership/);
    assert.match(query, /user_id = auth\.user_id\(\)/);
    assert.doesNotMatch(query, /visibility/);
    assert.doesNotMatch(query, /owner_user_id/);
  }
  assert.match(stream.queries[0], /FROM recurring_rules/);
  assert.match(stream.queries[1], /FROM recurring_occurrences/);
});

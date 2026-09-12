import assert from "node:assert/strict";
import test from "node:test";

import {
  IMPORT_ENTITY_TYPES,
  canonicalizeImportContent,
  manifestsMatch,
  type ImportEntityType,
  type ImportManifest,
} from "./import.ts";

test("IMPORT_ENTITY_TYPES lists every import entity kind in chunk order", () => {
  assert.deepEqual([...IMPORT_ENTITY_TYPES], [
    "account",
    "category",
    "recurring_rule",
    "budget_workspace",
    "envelope",
    "category_mapping",
    "funding_membership",
    "rollover_setting",
    "assignment",
    "transaction",
    "recurring_occurrence",
  ]);
});

test("IMPORT_ENTITY_TYPES membership is the ImportEntityType vocabulary", () => {
  const kinds = new Set<string>(IMPORT_ENTITY_TYPES);
  assert.equal(kinds.size, IMPORT_ENTITY_TYPES.length);
  for (const kind of IMPORT_ENTITY_TYPES) {
    assert.equal(kinds.has(kind), true);
  }
  assert.equal(kinds.has("unknown_entity"), false);
});

function emptyRowCounts(overrides: Partial<Record<ImportEntityType, number>> = {}) {
  return {
    account: 0,
    category: 0,
    recurring_rule: 0,
    budget_workspace: 0,
    envelope: 0,
    category_mapping: 0,
    funding_membership: 0,
    rollover_setting: 0,
    assignment: 0,
    transaction: 0,
    recurring_occurrence: 0,
    ...overrides,
  } satisfies Record<ImportEntityType, number>;
}

function manifest(partial: {
  readonly rowCounts?: Partial<Record<ImportEntityType, number>>;
  readonly transactionAmountMinorByAccount?: Readonly<Record<string, number>>;
  readonly contentDigest?: string;
}): ImportManifest {
  return {
    rowCounts: emptyRowCounts(partial.rowCounts),
    transactionAmountMinorByAccount: partial.transactionAmountMinorByAccount ?? {},
    contentDigest: partial.contentDigest ?? "digest-a",
  };
}

test("manifestsMatch accepts equal aggregates and digests", () => {
  const left = manifest({
    rowCounts: { account: 2, transaction: 5 },
    transactionAmountMinorByAccount: { acc_1: 100, acc_2: -40 },
    contentDigest: "abc",
  });
  const right = manifest({
    rowCounts: { account: 2, transaction: 5 },
    transactionAmountMinorByAccount: { acc_2: -40, acc_1: 100 },
    contentDigest: "abc",
  });
  assert.equal(manifestsMatch(left, right), true);
});

test("manifestsMatch rejects row-count, amount, or digest drift", () => {
  const base = manifest({
    rowCounts: { account: 1, transaction: 1 },
    transactionAmountMinorByAccount: { acc_1: 50 },
    contentDigest: "same",
  });

  assert.equal(
    manifestsMatch(base, manifest({ ...base, rowCounts: { account: 2, transaction: 1 } })),
    false,
  );
  assert.equal(
    manifestsMatch(
      base,
      manifest({
        rowCounts: { account: 1, transaction: 1 },
        transactionAmountMinorByAccount: { acc_1: 51 },
        contentDigest: "same",
      }),
    ),
    false,
  );
  assert.equal(
    manifestsMatch(
      base,
      manifest({
        rowCounts: { account: 1, transaction: 1 },
        transactionAmountMinorByAccount: { acc_1: 50 },
        contentDigest: "other",
      }),
    ),
    false,
  );
});

test("canonicalizeImportContent sorts entity type, id, and row keys stably", () => {
  const shuffled = canonicalizeImportContent([
    {
      entityType: "transaction",
      row: { amountMinor: 10, id: "txn_2", accountId: "acc_1" },
    },
    {
      entityType: "account",
      row: { name: "B", id: "acc_2", currency: "USD" },
    },
    {
      entityType: "account",
      row: { currency: "USD", id: "acc_1", name: "A" },
    },
    {
      entityType: "transaction",
      row: { id: "txn_1", accountId: "acc_1", amountMinor: 5 },
    },
  ]);

  const ordered = canonicalizeImportContent([
    {
      entityType: "account",
      row: { id: "acc_1", name: "A", currency: "USD" },
    },
    {
      entityType: "account",
      row: { id: "acc_2", name: "B", currency: "USD" },
    },
    {
      entityType: "transaction",
      row: { id: "txn_1", amountMinor: 5, accountId: "acc_1" },
    },
    {
      entityType: "transaction",
      row: { id: "txn_2", amountMinor: 10, accountId: "acc_1" },
    },
  ]);

  assert.equal(shuffled, ordered);
  assert.match(shuffled, /"entityType":"account".*"entityType":"transaction"/s);
});

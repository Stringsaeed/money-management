import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  LEDGER_SCOPED_0012_TABLES,
  LEDGER_SCOPED_TABLES,
  MIGRATION_TRACKING_TABLE,
  POWERSYNC_PUBLICATION_TABLES,
  SCHEMA_CHECKS,
  buildSchemaVerificationResult,
  readSchemaSnapshot,
} from "./verify-post-cutover-schema-lib.mjs";

const SNAPSHOT_BUILDERS = {
  table: (snapshot, check) => snapshot.tables.push({ table_name: check.table }),
  column: (snapshot, check) =>
    snapshot.columns.push({
      table_name: check.table,
      column_name: check.column,
      is_nullable: check.isNullable,
    }),
  constraint: (snapshot, check) =>
    snapshot.constraints.push({
      table_name: check.table,
      constraint_name: check.name,
      definition: check.definitionIncludes?.join(" ") ?? "",
    }),
  index: (snapshot, check) =>
    snapshot.indexes.push({
      tablename: check.table,
      indexname: check.name,
      indexdef: check.definitionIncludes?.join(" ") ?? "CREATE INDEX",
    }),
  "publication-table": (snapshot, check) =>
    snapshot.publicationTables.push({
      pubname: check.publication,
      schemaname: check.schema,
      tablename: check.table,
    }),
};

function completeSnapshot() {
  const snapshot = {
    tables: [],
    columns: [],
    constraints: [],
    indexes: [],
    publicationTables: [],
    routines: [],
    triggers: [],
  };

  for (const check of SCHEMA_CHECKS) {
    const builder = SNAPSHOT_BUILDERS[check.type];
    if (builder) builder(snapshot, check);
  }

  return snapshot;
}

function findCheck(type, predicate) {
  const check = SCHEMA_CHECKS.find((candidate) => candidate.type === type && predicate(candidate));
  assert.ok(check, "expected schema check declaration");
  return check;
}

test("complete 0011-0015 catalog passes strict verification", () => {
  const result = buildSchemaVerificationResult(completeSnapshot());

  assert.equal(result.ok, true);
  assert.deepEqual(result.missing, []);
  assert.equal(result.checked, SCHEMA_CHECKS.length);
  assert.equal(result.present["publication:powersync.public.ledger"], true);
  assert.equal(result.present["absent-table:session"], true);
});

test("future migration markers must match the checked-in tag and checksum", () => {
  const snapshot = completeSnapshot();
  const migration = {
    version: 16,
    tag: "0016_future_schema",
    sha256: "a".repeat(64),
  };
  snapshot.tables.push({ table_name: MIGRATION_TRACKING_TABLE });
  snapshot.migrationMarkers = [migration];

  const result = buildSchemaVerificationResult(snapshot, { expectedMigrations: [migration] });

  assert.equal(result.ok, true);
  assert.equal(result.missing.length, 0);

  snapshot.migrationMarkers = [{ ...migration, sha256: "b".repeat(64) }];
  const drift = buildSchemaVerificationResult(snapshot, { expectedMigrations: [migration] });
  assert.equal(drift.ok, false);
  assert.deepEqual(drift.missing, ["migration-marker:0016_future_schema (tag/checksum mismatch)"]);
});

test("all sixteen finance tables require a non-null ledger_id", () => {
  assert.equal(LEDGER_SCOPED_TABLES.length, 16);
  for (const table of LEDGER_SCOPED_TABLES) {
    assert.ok(
      SCHEMA_CHECKS.some(
        (check) =>
          check.type === "column" &&
          check.table === table &&
          check.column === "ledger_id" &&
          check.isNullable === "NO",
      ),
      `${table}.ledger_id NOT NULL check is missing`,
    );
  }
});

test("missing 0012 ledger column fails with its exact object name", () => {
  const snapshot = completeSnapshot();
  const missingCheck = findCheck(
    "column",
    (check) =>
      check.table === "budget_workspaces" &&
      check.column === "ledger_id" &&
      check.isNullable === "NO",
  );
  snapshot.columns = snapshot.columns.filter(
    (row) => !(row.table_name === missingCheck.table && row.column_name === missingCheck.column),
  );

  const result = buildSchemaVerificationResult(snapshot);

  assert.equal(result.ok, false);
  assert.deepEqual(result.missing, [missingCheck.key]);
});

test("missing 0012 nullable household column, guard, index, and cache key all fail", () => {
  const snapshot = completeSnapshot();
  const nullableHousehold = findCheck(
    "column",
    (check) =>
      check.table === "period_projection_cache" &&
      check.column === "household_id" &&
      check.isNullable === "YES",
  );
  const householdGuard = findCheck(
    "constraint",
    (check) =>
      check.table === "period_projection_cache" &&
      check.name === "period_projection_cache_household_required_for_organization",
  );
  const ledgerIndex = findCheck(
    "index",
    (check) =>
      check.table === "recurring_occurrences" &&
      check.name === "recurring_occurrences_ledger_rule_idx",
  );
  const uniqueLedgerIndex = findCheck(
    "index",
    (check) =>
      check.table === "budget_workspaces" &&
      check.name === "budget_workspaces_ledger_currency_unique",
  );
  const cachePrimaryKey = findCheck(
    "constraint",
    (check) =>
      check.table === "period_projection_cache" &&
      check.name === "period_projection_cache_ledger_id_currency_budget_period_pk",
  );

  snapshot.columns = snapshot.columns.filter(
    (row) =>
      !(row.table_name === nullableHousehold.table && row.column_name === nullableHousehold.column),
  );
  snapshot.constraints = snapshot.constraints.filter(
    (row) => ![householdGuard.name, cachePrimaryKey.name].includes(row.constraint_name),
  );
  snapshot.indexes = snapshot.indexes.filter(
    (row) => ![ledgerIndex.name, uniqueLedgerIndex.name].includes(row.indexname),
  );

  const result = buildSchemaVerificationResult(snapshot);

  assert.equal(result.ok, false);
  assert.deepEqual(result.missing, [
    nullableHousehold.key,
    cachePrimaryKey.key,
    householdGuard.key,
    uniqueLedgerIndex.key,
    ledgerIndex.key,
  ]);
});

test("publication must include ledger and its 0012 members", () => {
  const snapshot = completeSnapshot();
  snapshot.publicationTables = snapshot.publicationTables.filter(
    (row) => row.tablename !== "ledger" && !LEDGER_SCOPED_0012_TABLES.includes(row.tablename),
  );

  const result = buildSchemaVerificationResult(snapshot);

  assert.equal(result.ok, false);
  assert.ok(result.missing.includes("publication:powersync.public.ledger"));
  for (const table of POWERSYNC_PUBLICATION_TABLES.filter((table) =>
    LEDGER_SCOPED_0012_TABLES.includes(table),
  )) {
    assert.ok(result.missing.includes(`publication:powersync.public.${table}`), table);
  }
  assert.equal(POWERSYNC_PUBLICATION_TABLES.length, 14);
});

test("legacy auth tables and private-account objects are absence checks", () => {
  const snapshot = completeSnapshot();
  snapshot.tables.push({ table_name: "session" });
  snapshot.columns.push({ table_name: "accounts", column_name: "visibility", is_nullable: "YES" });
  snapshot.constraints.push({
    table_name: "accounts",
    constraint_name: "accounts_private_owner_required",
  });
  snapshot.indexes.push({
    tablename: "accounts",
    indexname: "accounts_household_visibility_owner_idx",
  });

  const result = buildSchemaVerificationResult(snapshot);

  assert.equal(result.ok, false);
  assert.ok(result.missing.includes("absent-table:session"));
  assert.ok(result.missing.includes("absent-column:accounts.visibility"));
  assert.ok(result.missing.includes("absent-constraint:accounts.accounts_private_owner_required"));
  assert.ok(
    result.missing.includes("absent-index:accounts.accounts_household_visibility_owner_idx"),
  );
});

test("verifier source contains no mutation API or DDL", () => {
  const source = readFileSync(new URL("./verify-post-cutover-schema.mjs", import.meta.url), "utf8");

  assert.doesNotMatch(source, /\.unsafe\s*\(/);
  assert.doesNotMatch(
    source,
    /\b(?:ALTER\s+TABLE|CREATE\s+(?:TABLE|INDEX)|DROP\s+(?:TABLE|INDEX)|INSERT\s+INTO|UPDATE\s+|DELETE\s+FROM|TRUNCATE\s+)/i,
  );
});

test("catalog reader issues SELECT-only queries", async () => {
  const statements = [];
  const fakeSql = (strings) => {
    const statement = strings.join("?").trim();
    statements.push(statement);
    if (statement.includes("table_name = ?")) return [{ table_name: MIGRATION_TRACKING_TABLE }];
    return [];
  };

  const snapshot = await readSchemaSnapshot(fakeSql);

  assert.deepEqual(snapshot.migrationMarkers, []);
  assert.ok(statements.length >= 8);
  for (const statement of statements) assert.match(statement, /^SELECT\b/i);
});

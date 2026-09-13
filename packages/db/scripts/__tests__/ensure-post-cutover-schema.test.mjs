import assert from "node:assert/strict";
import test from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  POST_CUTOVER_MIGRATIONS,
  PRESENCE_CHECKS,
  allPresenceChecksPass,
  buildEnsureResult,
  isAlreadyExists,
  isAlterPermissionDenied,
  isMissingSchemaObject,
  loadPostCutoverMigrations,
  runPostCutoverStatements,
  splitMigrationStatements,
} from "../ensure-post-cutover-schema-lib.mjs";

test("isAlterPermissionDenied matches Postgres 42501", () => {
  assert.equal(
    isAlterPermissionDenied(
      Object.assign(new Error("must be owner of table accounts"), { code: "42501" }),
    ),
    true,
  );
  assert.equal(
    isAlterPermissionDenied(Object.assign(new Error("undefined column"), { code: "42703" })),
    false,
  );
});

test("isMissingSchemaObject matches undefined column/table", () => {
  assert.equal(
    isMissingSchemaObject(
      Object.assign(new Error('column "ledger_id" does not exist'), { code: "42703" }),
    ),
    true,
  );
  assert.equal(
    isMissingSchemaObject(
      Object.assign(new Error('column "visibility" does not exist'), { code: "42703" }),
    ),
    true,
  );
  assert.equal(
    isMissingSchemaObject(
      Object.assign(new Error('relation "ledger" does not exist'), { code: "42P01" }),
    ),
    true,
  );
  assert.equal(
    isMissingSchemaObject(Object.assign(new Error("must be owner"), { code: "42501" })),
    false,
  );
});

test("isAlreadyExists matches duplicate DDL codes and messages", () => {
  assert.equal(
    isAlreadyExists(Object.assign(new Error("constraint already exists"), { code: "42710" })),
    true,
  );
  assert.equal(
    isAlreadyExists(Object.assign(new Error("relation already exists"), { code: "42P07" })),
    true,
  );
  assert.equal(
    isAlreadyExists(Object.assign(new Error("multiple primary keys for table"), { code: "42P16" })),
    true,
  );
  assert.equal(
    isAlreadyExists(Object.assign(new Error("must be owner"), { code: "42501" })),
    false,
  );
});

test("splitMigrationStatements drops empty chunks", () => {
  assert.deepEqual(splitMigrationStatements("A;--> statement-breakpoint\n\nB;"), ["A;", "B;"]);
});

test("loadPostCutoverMigrations reads 0011–0015 SQL from disk", () => {
  const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), "../../src/migrations");
  const loaded = loadPostCutoverMigrations(POST_CUTOVER_MIGRATIONS, migrationsDir);
  assert.equal(loaded.length, 5);
  assert.equal(loaded[0].tag, "0011_ledger_scope");
  assert.equal(loaded[4].tag, "0015_remove_legacy_auth_and_private_accounts");
  assert.ok(loaded[0].statements.some((s) => s.includes('CREATE TABLE IF NOT EXISTS "ledger"')));
  assert.ok(loaded[0].statements.some((s) => s.includes('ADD COLUMN IF NOT EXISTS "ledger_id"')));
  assert.ok(
    loaded[2].statements.some((s) => s.includes('ADD COLUMN IF NOT EXISTS "create_request_id"')),
  );
  assert.ok(loaded.every((migration) => migration.statements.length > 0));
});

test("buildEnsureResult soft-oks on 42501 even when columns missing", () => {
  /** @type {Record<string, boolean>} */
  const present = Object.fromEntries(PRESENCE_CHECKS.map((c) => [c.key, false]));
  const denied = buildEnsureResult({
    present,
    alterPermissionDenied: true,
    applied: [],
    permissionDenied: [{ migration: "0011_ledger_scope", message: "must be owner" }],
    alreadyExists: [],
  });
  assert.equal(denied.ok, true);
  assert.equal(denied.alter_permission_denied, true);
  assert.equal(denied.code, "42501");
  assert.equal(allPresenceChecksPass({ present }), false);

  const allPresent = Object.fromEntries(PRESENCE_CHECKS.map((c) => [c.key, true]));
  const success = buildEnsureResult({
    present: allPresent,
    alterPermissionDenied: false,
    applied: ["0011_ledger_scope"],
    permissionDenied: [],
    alreadyExists: [],
  });
  assert.equal(success.ok, true);
  assert.equal(success.alter_permission_denied, false);
  assert.equal(success.code, undefined);

  const hardFail = buildEnsureResult({
    present,
    alterPermissionDenied: false,
    applied: [],
    permissionDenied: [],
    alreadyExists: [],
  });
  assert.equal(hardFail.ok, false);
});

test("runPostCutoverStatements soft-fails 42703/42P01 after 42501 and continues", async () => {
  /** @type {Record<string, unknown>[]} */
  const warnings = [];
  const migrations = [
    {
      tag: "0011_ledger_scope",
      statements: [
        "ALTER TABLE accounts ADD COLUMN ledger_id",
        "CREATE INDEX ON accounts (ledger_id)",
      ],
    },
    {
      tag: "0015_remove_legacy_auth_and_private_accounts",
      statements: [
        "ALTER TABLE accounts DROP COLUMN visibility",
        "ALTER TABLE ledger ADD COLUMN x",
      ],
    },
  ];

  /** @type {Map<string, Error>} */
  const failures = new Map([
    [
      "ALTER TABLE accounts ADD COLUMN ledger_id",
      Object.assign(new Error("must be owner of table accounts"), { code: "42501" }),
    ],
    [
      "CREATE INDEX ON accounts (ledger_id)",
      Object.assign(new Error('column "ledger_id" does not exist'), { code: "42703" }),
    ],
    [
      "ALTER TABLE accounts DROP COLUMN visibility",
      Object.assign(new Error('column "visibility" does not exist'), { code: "42703" }),
    ],
    [
      "ALTER TABLE ledger ADD COLUMN x",
      Object.assign(new Error('relation "ledger" does not exist'), { code: "42P01" }),
    ],
  ]);

  let executed = 0;
  const outcome = await runPostCutoverStatements({
    migrations,
    executeStatement: async (statement) => {
      executed += 1;
      const failure = failures.get(statement);
      if (failure) throw failure;
    },
    warn: (payload) => warnings.push(payload),
  });

  assert.equal(executed, 4, "loop must continue through all statements");
  assert.equal(outcome.alterPermissionDenied, true);
  assert.deepEqual(outcome.applied, []);
  assert.equal(outcome.permissionDenied.length, 1);
  assert.equal(outcome.permissionDenied[0].migration, "0011_ledger_scope");
  assert.equal(outcome.missingAfterDenied.length, 3);
  assert.deepEqual(
    outcome.missingAfterDenied.map((entry) => entry.code),
    ["42703", "42703", "42P01"],
  );
  assert.ok(warnings.some((w) => w.warning === "alter_permission_denied"));
  assert.equal(
    warnings.filter((w) => w.warning === "missing_schema_object_after_permission_denied").length,
    3,
  );

  // Mirror the script's structured soft-ok payload field name.
  const softOkPayload = {
    ok: true,
    alter_permission_denied: true,
    code: "42501",
    applied: outcome.applied,
    missing_after_denied: outcome.missingAfterDenied,
  };
  assert.equal(softOkPayload.missing_after_denied.length, 3);
  assert.equal(softOkPayload.missing_after_denied[2].code, "42P01");
});

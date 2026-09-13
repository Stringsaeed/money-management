import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  buildMigrationQuery,
  buildPscaleArgs,
  loadJournalMigrations,
  runPostgresMigration,
  selectMigration,
  sha256,
} from "./run-postgres-migration.mjs";

function fixture({
  tag = "0016_example",
  sql = "CREATE TABLE example (id integer PRIMARY KEY);",
} = {}) {
  const root = mkdtempSync(join(tmpdir(), "trove-postgres-migration-"));
  const journalPath = join(root, "_journal.json");
  writeFileSync(join(root, `${tag}.sql`), sql);
  writeFileSync(
    journalPath,
    JSON.stringify({
      version: "7",
      dialect: "postgresql",
      entries: [
        { idx: 0, version: "7", tag: "0007_postgres_baseline", breakpoints: true },
        { idx: 1, version: "7", tag: "0015_legacy_auth", breakpoints: true },
        { idx: 2, version: "7", tag, breakpoints: true },
      ],
    }),
  );
  return { root, journalPath };
}

const environment = {
  PLANETSCALE_SERVICE_TOKEN_ID: "token-id",
  PLANETSCALE_SERVICE_TOKEN: "token-secret",
  PLANETSCALE_ORG: "saeed",
  PLANETSCALE_DATABASE: "trove",
  PLANETSCALE_BRANCH: "main",
  PLANETSCALE_MIGRATION_TAG: "0016_example",
};

test("journal allowlist ignores 0007–0015 and loads only future tags", () => {
  const { root, journalPath } = fixture();
  try {
    const migrations = loadJournalMigrations({ journalPath, migrationsDir: root });
    assert.deepEqual(
      migrations.map((migration) => migration.tag),
      ["0016_example"],
    );
    assert.equal(migrations[0].version, 16);
    assert.equal(migrations[0].sha256, sha256("CREATE TABLE example (id integer PRIMARY KEY);"));
    assert.equal(selectMigration(migrations, "0016_example").tag, "0016_example");
    assert.throws(() => selectMigration(migrations, "0015_legacy_auth"), /not allowlisted/);
    assert.throws(() => selectMigration(migrations, "0016_example.sql"), /exact journal tag/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("transaction query records version, tag, and checksum and skips drift", () => {
  const { root, journalPath } = fixture({
    sql: "CREATE TABLE example (id integer PRIMARY KEY);--> statement-breakpoint\nCREATE INDEX example_id ON example (id);",
  });
  try {
    const [migration] = loadJournalMigrations({ journalPath, migrationsDir: root });
    const query = buildMigrationQuery(migration);
    assert.match(query, /^BEGIN;/);
    assert.match(query, /pg_advisory_xact_lock/);
    assert.match(query, /trove_schema_migrations/);
    assert.match(query, /existing_sha256 IS DISTINCT FROM/);
    assert.match(query, /EXECUTE \$trove_migration_/);
    assert.match(query, /COMMIT;$/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("runner invokes pscale admin SQL without placing service tokens in argv", async () => {
  const { root, journalPath } = fixture();
  const calls = [];
  try {
    const result = await runPostgresMigration({
      environment,
      journalPath,
      migrationsDir: root,
      execute: async (args, passedEnvironment) => {
        calls.push({ args, passedEnvironment });
        return { status: "ok", rows_affected: 1 };
      },
    });
    assert.equal(result.ok, true);
    assert.deepEqual(result.migration, {
      version: 16,
      tag: "0016_example",
      sha256: sha256("CREATE TABLE example (id integer PRIMARY KEY);"),
    });
    assert.deepEqual(calls[0].args.slice(0, 12), [
      "sql",
      "trove",
      "main",
      "--org",
      "saeed",
      "--format",
      "json",
      "--role",
      "admin",
      "--dbname",
      "postgres",
      "--query",
    ]);
    assert.equal(calls[0].args.includes("token-secret"), false);
    assert.equal(calls[0].passedEnvironment.PLANETSCALE_SERVICE_TOKEN, "token-secret");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("destructive SQL opts into pscale force only through journal-selected content", () => {
  const { root, journalPath } = fixture({ sql: "DROP TABLE example;" });
  try {
    const [migration] = loadJournalMigrations({ journalPath, migrationsDir: root });
    const args = buildPscaleArgs({
      organization: "saeed",
      database: "trove",
      branch: "main",
      migration,
    });
    assert.equal(args.includes("--force"), true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("runner fails closed for missing credentials and non-journal tags", async () => {
  const { root, journalPath } = fixture();
  try {
    await assert.rejects(
      runPostgresMigration({
        environment: { ...environment, PLANETSCALE_SERVICE_TOKEN: "" },
        journalPath,
        migrationsDir: root,
        execute: async () => ({ status: "ok" }),
      }),
      /PLANETSCALE_SERVICE_TOKEN/,
    );
    await assert.rejects(
      runPostgresMigration({
        environment: { ...environment, PLANETSCALE_MIGRATION_TAG: "0016_sql_injection;DROP" },
        journalPath,
        migrationsDir: root,
        execute: async () => ({ status: "ok" }),
      }),
      /exact journal tag/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("journal migration cannot manage its own transaction", () => {
  const { root, journalPath } = fixture({ sql: "BEGIN; CREATE TABLE example (id integer);" });
  try {
    assert.throws(
      () => loadJournalMigrations({ journalPath, migrationsDir: root }),
      /must not manage its own transaction/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

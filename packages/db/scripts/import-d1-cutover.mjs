import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import Database from "better-sqlite3";
import postgres from "postgres";

import { CUTOVER_TABLES, digestRows, RESET_TABLES, transformRow } from "./d1-cutover-lib.mjs";

const args = new Set(process.argv.slice(2));
const execute = args.has("--execute");
const prepareSchema = args.has("--prepare-schema");
const resetTarget = args.has("--reset-target");
const sourcePath = required("D1_CUTOVER_SOURCE");
const exportPath = required("D1_CUTOVER_EXPORT");
const targetUrl = required("PLANETSCALE_TARGET_URL");
const target = required("D1_CUTOVER_TARGET");
const mode = required("D1_CUTOVER_MODE");
const expectedSourceHash = required("D1_CUTOVER_SOURCE_SHA256");
const expectedExportHash = required("D1_CUTOVER_EXPORT_SHA256");

assertAuthorization({ execute, mode, prepareSchema, resetTarget, target });
assertFileHash(sourcePath, expectedSourceHash, "restored SQLite source");
assertFileHash(exportPath, expectedExportHash, "D1 SQL export");

const connectionUrl = new URL(targetUrl);
connectionUrl.searchParams.delete("sslrootcert");
const sql = postgres(connectionUrl.toString(), { max: 1, ssl: "prefer" });
const source = new Database(sourcePath, { readonly: true, fileMustExist: true });

try {
  if (prepareSchema) await applyMigrations(sql);
  const targetColumns = await loadTargetColumns(sql);
  const prepared = prepareRows(source, targetColumns);
  const before = await targetCounts(sql, prepared);
  const plan = {
    mode,
    target,
    execute,
    prepareSchema,
    resetTarget,
    sourceSha256: expectedSourceHash,
    exportSha256: expectedExportHash,
    sourceCounts: countsOf(prepared),
    targetCountsBefore: before,
  };
  if (!execute) {
    console.log(JSON.stringify({ ...plan, result: "plan" }, null, 2));
  } else {
    await sql.begin(async (transaction) => {
      await transaction`SELECT pg_advisory_xact_lock(hashtext(${"trove-d1-cutover"}))`;
      if (resetTarget) await resetDatabase(transaction);
      for (const table of CUTOVER_TABLES) {
        await insertRows(transaction, table.name, prepared.get(table.name) ?? [], targetColumns);
      }
      await rebuildChangeSequences(transaction);
    });
    const verification = await verifyTarget(sql, prepared, targetColumns);
    console.log(JSON.stringify({ ...plan, verification, result: "pass" }, null, 2));
  }
} finally {
  source.close();
  await sql.end();
}

function assertAuthorization(input) {
  if (!["dry-run", "production"].includes(input.mode)) {
    throw new Error("D1_CUTOVER_MODE must be dry-run or production.");
  }
  if (input.prepareSchema && input.mode !== "dry-run") {
    throw new Error("--prepare-schema is allowed only on an isolated dry-run branch.");
  }
  if (!input.execute) return;
  const approval = required("D1_CUTOVER_APPROVAL");
  if (input.mode === "dry-run") assertDryRunApproval(approval);
  if (input.mode === "production") assertProductionApproval(input, approval);
}

function assertDryRunApproval(approval) {
  if (approval !== "dry-run") {
    throw new Error("Dry-run execution requires D1_CUTOVER_APPROVAL=dry-run.");
  }
}

function assertProductionApproval(input, approval) {
  if (input.target !== "trove/main" || approval !== "import-d1-into-trove-main") {
    throw new Error(
      "Production execution requires target trove/main and D1_CUTOVER_APPROVAL=import-d1-into-trove-main.",
    );
  }
  if (!input.resetTarget) {
    throw new Error(
      "Production import must use --reset-target so D1 remains the exact source of truth.",
    );
  }
}

function assertFileHash(path, expected, label) {
  const actual = createHash("sha256").update(readFileSync(path)).digest("hex");
  if (actual !== expected) throw new Error(`${label} checksum mismatch: expected ${expected}.`);
}

async function applyMigrations(database) {
  for (const name of [
    "0007_postgres_baseline.sql",
    "0008_powersync_row_ids.sql",
    "0009_expand_powersync_publication.sql",
    "0010_concurrent_change_sequence.sql",
  ]) {
    const migration = readFileSync(new URL(`../src/migrations/${name}`, import.meta.url), "utf8");
    for (const statement of migration.split("--> statement-breakpoint")) {
      const source = statement.trim();
      if (source) await database.unsafe(source);
    }
  }
}

async function loadTargetColumns(database) {
  const names = CUTOVER_TABLES.map(({ name }) => name);
  const rows = await database`
    SELECT table_name, column_name, data_type, ordinal_position
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = ANY(${names})
    ORDER BY table_name, ordinal_position
  `;
  const columns = new Map();
  for (const row of rows) {
    const list = columns.get(row.table_name) ?? [];
    list.push({ name: row.column_name, dataType: row.data_type });
    columns.set(row.table_name, list);
  }
  const missing = names.filter((name) => !columns.has(name));
  if (missing.length > 0) throw new Error(`Target schema is missing tables: ${missing.join(", ")}`);
  return columns;
}

function prepareRows(database, columns) {
  const prepared = new Map();
  for (const table of CUTOVER_TABLES) {
    const sourceRows = database.prepare(`SELECT * FROM "${table.name}"`).all();
    const ordered = table.sort ? table.sort(sourceRows) : sourceRows;
    prepared.set(
      table.name,
      ordered.map((row) => transformRow(row, columns.get(table.name), table.id)),
    );
  }
  return prepared;
}

async function resetDatabase(database) {
  const names = RESET_TABLES.map(quoteIdentifier).join(", ");
  await database.unsafe(`TRUNCATE TABLE ${names} CASCADE`);
}

async function insertRows(database, tableName, rows, columns) {
  if (rows.length === 0) return;
  const tableColumns = columns.get(tableName);
  for (const row of rows) {
    const names = Object.keys(row);
    const definitions = new Map(tableColumns.map((column) => [column.name, column]));
    const placeholders = names.map((name, index) => {
      const cast = definitions.get(name)?.dataType === "jsonb" ? "::jsonb" : "";
      return `$${index + 1}${cast}`;
    });
    const values = names.map((name) => {
      const value = row[name];
      return definitions.get(name)?.dataType === "jsonb" ? JSON.stringify(value) : value;
    });
    const statement = `INSERT INTO ${quoteIdentifier(tableName)} (${names
      .map(quoteIdentifier)
      .join(", ")}) VALUES (${placeholders.join(", ")})`;
    await database.unsafe(statement, values);
  }
}

async function rebuildChangeSequences(database) {
  await database`
    INSERT INTO household_change_sequences (household_id, seq)
    SELECT household_id, MAX(seq)
    FROM household_changes
    GROUP BY household_id
    ON CONFLICT (household_id) DO UPDATE SET seq = excluded.seq
  `;
}

async function verifyTarget(database, expected, columns) {
  const tables = {};
  for (const table of CUTOVER_TABLES) {
    const names = columns.get(table.name).map(({ name }) => name);
    const actual = await database.unsafe(
      `SELECT ${names.map(quoteIdentifier).join(", ")} FROM ${quoteIdentifier(table.name)}`,
    );
    const expectedRows = expected.get(table.name) ?? [];
    const expectedDigest = digestRows(expectedRows);
    const actualDigest = digestRows(
      actual.map((row) => transformRow(row, columns.get(table.name), table.id)),
    );
    if (expectedRows.length !== actual.length || expectedDigest !== actualDigest) {
      throw new Error(`Parity failed for ${table.name}.`);
    }
    tables[table.name] = { rows: actual.length, sha256: actualDigest };
  }
  return { tables };
}

async function targetCounts(database, prepared) {
  const result = {};
  for (const name of prepared.keys()) {
    const rows = await database.unsafe(
      `SELECT COUNT(*)::int AS count FROM ${quoteIdentifier(name)}`,
    );
    result[name] = rows[0].count;
  }
  return result;
}

function countsOf(prepared) {
  return Object.fromEntries([...prepared].map(([name, rows]) => [name, rows.length]));
}

function quoteIdentifier(value) {
  if (!/^[a-z_]+$/.test(value)) throw new Error(`Unsafe SQL identifier: ${value}`);
  return `"${value}"`;
}

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

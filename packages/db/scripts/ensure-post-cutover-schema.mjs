import postgres from "postgres";

import {
  PRESENCE_CHECKS,
  buildEnsureResult,
  isAlreadyExists,
  isAlterPermissionDenied,
  loadPostCutoverMigrations,
} from "./ensure-post-cutover-schema-lib.mjs";

/**
 * Best-effort prod ensure for post-D1-cutover migrations 0011–0015.
 * Cutover import historically stopped at 0010; tip Worker code needs ledger
 * scope, WorkOS household columns, deletion ops, and legacy-auth cleanup.
 *
 * PLANETSCALE_* deploy credentials may lack table-owner ALTER/CREATE
 * privilege (42501). Soft-fail like ensure-user-memberships-reconciled-at so
 * Alchemy deploy still ships Worker code. Sync/create stay broken until a
 * table-owner role can apply this DDL — this script only makes that apply
 * automatic once ownership is fixed.
 */
if (process.env.APPROVE_USER_SCHEMA_ENSURE !== "listmine-500") {
  throw new Error(
    "Refusing to alter post-cutover schema without APPROVE_USER_SCHEMA_ENSURE=listmine-500.",
  );
}

function connectionStringFromEnv() {
  const direct = process.env.DATABASE_URL?.trim();
  if (direct) return direct;

  const host = process.env.PLANETSCALE_HOST?.trim();
  const database = process.env.PLANETSCALE_DATABASE?.trim() || "postgres";
  const user = process.env.PLANETSCALE_USER?.trim();
  const password = process.env.PLANETSCALE_PASSWORD ?? "";
  if (!host || !user) {
    throw new Error("DATABASE_URL or PLANETSCALE_HOST + PLANETSCALE_USER are required.");
  }
  const url = new URL(`postgresql://${host}:6432/${database}`);
  url.username = user;
  url.password = password;
  url.searchParams.set("sslmode", "prefer");
  return url.toString();
}

/**
 * @param {import("postgres").Sql} sql
 * @returns {Promise<Record<string, boolean>>}
 */
async function readPresence(sql) {
  /** @type {Record<string, boolean>} */
  const present = {};
  for (const check of PRESENCE_CHECKS) {
    if (check.kind === "table") {
      const rows = await sql`
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = ${check.table}
        LIMIT 1
      `;
      present[check.key] = rows.length === 1;
      continue;
    }
    const rows = await sql`
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = ${check.table}
        AND column_name = ${check.column}
      LIMIT 1
    `;
    present[check.key] = rows.length === 1;
  }
  return present;
}

const connectionUrl = new URL(connectionStringFromEnv());
connectionUrl.searchParams.delete("sslrootcert");

const sql = postgres(connectionUrl.toString(), { max: 1, ssl: "prefer" });

try {
  const migrations = loadPostCutoverMigrations();
  /** @type {string[]} */
  const applied = [];
  /** @type {Array<{ migration: string, message: string }>} */
  const permissionDenied = [];
  /** @type {Array<{ migration: string, message: string }>} */
  const alreadyExists = [];
  let alterPermissionDenied = false;

  for (const migration of migrations) {
    let migrationApplied = false;
    for (const statement of migration.statements) {
      try {
        await sql.unsafe(statement);
        migrationApplied = true;
      } catch (error) {
        if (!(error instanceof Error)) throw error;
        if (isAlterPermissionDenied(error)) {
          alterPermissionDenied = true;
          permissionDenied.push({ migration: migration.tag, message: error.message });
          console.warn(
            JSON.stringify({
              warning: "alter_permission_denied",
              code: "42501",
              migration: migration.tag,
              message: error.message,
            }),
          );
          continue;
        }
        if (isAlreadyExists(error)) {
          alreadyExists.push({ migration: migration.tag, message: error.message });
          migrationApplied = true;
          continue;
        }
        throw error;
      }
    }
    if (migrationApplied) applied.push(migration.tag);
  }

  const present = await readPresence(sql);
  const result = buildEnsureResult({
    present,
    alterPermissionDenied,
    applied,
    permissionDenied,
    alreadyExists,
  });

  if (alterPermissionDenied) {
    console.warn(
      JSON.stringify({
        ok: true,
        alter_permission_denied: true,
        code: "42501",
        applied,
        present,
        permission_denied: permissionDenied,
      }),
    );
  }

  console.log(JSON.stringify(result, null, 2));

  if (!result.ok) {
    process.exitCode = 1;
  }
} finally {
  await sql.end();
}

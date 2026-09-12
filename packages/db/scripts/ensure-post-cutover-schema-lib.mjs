import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/** Migrations applied after D1 cutover stopped at 0010. */
export const POST_CUTOVER_MIGRATIONS = [
  "0011_ledger_scope.sql",
  "0012_budget_recurring_ledger_scope.sql",
  "0013_workos_households.sql",
  "0014_deletion_ops.sql",
  "0015_remove_legacy_auth_and_private_accounts.sql",
];

/** Representative objects that Sync / household create need after 0011–0015. */
export const PRESENCE_CHECKS = [
  { key: "ledger", kind: "table", table: "ledger" },
  { key: "accounts.ledger_id", kind: "column", table: "accounts", column: "ledger_id" },
  {
    key: "budget_workspaces.ledger_id",
    kind: "column",
    table: "budget_workspaces",
    column: "ledger_id",
  },
  { key: "membership.status", kind: "column", table: "membership", column: "status" },
  {
    key: "household.create_request_id",
    kind: "column",
    table: "household",
    column: "create_request_id",
  },
  {
    key: "user.memberships_reconciled_at",
    kind: "column",
    table: "user",
    column: "memberships_reconciled_at",
  },
  { key: "widget_handoff", kind: "table", table: "widget_handoff" },
  { key: "deletion_operation", kind: "table", table: "deletion_operation" },
  { key: "deleted_identity", kind: "table", table: "deleted_identity" },
];

/**
 * @param {Error} error
 * @returns {boolean}
 */
export function isAlterPermissionDenied(error) {
  return "code" in error && String(error.code) === "42501";
}

/**
 * Undefined column (42703) or undefined table (42P01). After a 42501 soft-fail,
 * later statements often reference objects the denied ALTER never created.
 * @param {Error} error
 * @returns {boolean}
 */
export function isMissingSchemaObject(error) {
  const code = "code" in error ? String(error.code) : "";
  return code === "42703" || code === "42P01";
}

/**
 * Idempotent re-runs hit duplicate_object / duplicate_table / duplicate_column,
 * or PG messages like "already exists" / "multiple primary keys".
 * @param {Error} error
 * @returns {boolean}
 */
export function isAlreadyExists(error) {
  const code = "code" in error ? String(error.code) : "";
  if (code === "42710" || code === "42P07" || code === "42701" || code === "42P16") {
    return true;
  }
  const message = error.message ?? "";
  return /already exists/i.test(message) || /multiple primary keys/i.test(message);
}

/**
 * @param {string} sql
 * @returns {string[]}
 */
export function splitMigrationStatements(sql) {
  return sql
    .split("--> statement-breakpoint")
    .map((chunk) => chunk.trim())
    .filter(Boolean);
}

const DEFAULT_MIGRATIONS_DIR = fileURLToPath(new URL("../src/migrations/", import.meta.url));

/**
 * @param {string} fileName
 * @param {string} [migrationsDir]
 * @returns {{ fileName: string, tag: string, statements: string[] }}
 */
export function loadMigration(fileName, migrationsDir = DEFAULT_MIGRATIONS_DIR) {
  const dir = migrationsDir.endsWith("/") ? migrationsDir : `${migrationsDir}/`;
  const source = readFileSync(`${dir}${fileName}`, "utf8");
  return {
    fileName,
    tag: fileName.replace(/\.sql$/, ""),
    statements: splitMigrationStatements(source),
  };
}

/**
 * @param {Iterable<string>} [fileNames]
 * @param {string} [migrationsDir]
 */
export function loadPostCutoverMigrations(
  fileNames = POST_CUTOVER_MIGRATIONS,
  migrationsDir = DEFAULT_MIGRATIONS_DIR,
) {
  return [...fileNames].map((fileName) => loadMigration(fileName, migrationsDir));
}

/**
 * @param {{ present: Record<string, boolean> }} input
 * @returns {boolean}
 */
export function allPresenceChecksPass(input) {
  return PRESENCE_CHECKS.every((check) => input.present[check.key] === true);
}

/**
 * @param {{
 *   present: Record<string, boolean>,
 *   alterPermissionDenied: boolean,
 *   applied: string[],
 *   permissionDenied: Array<{ migration: string, message: string }>,
 *   alreadyExists: Array<{ migration: string, message: string }>,
 * }} input
 */
export function buildEnsureResult(input) {
  const criticalPresent = allPresenceChecksPass(input);
  return {
    ok: criticalPresent || input.alterPermissionDenied,
    applied: input.applied,
    present: input.present,
    alter_permission_denied: input.alterPermissionDenied,
    code: input.alterPermissionDenied ? "42501" : undefined,
    permission_denied: input.permissionDenied,
    already_exists: input.alreadyExists,
  };
}

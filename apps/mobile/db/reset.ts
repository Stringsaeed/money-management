/**
 * One-shot database reset, gated by a version number.
 *
 * Bumping {@link DATABASE_RESET_VERSION} wipes every table on the next launch —
 * for every user, on every channel — and lets migrations rebuild the schema from
 * scratch. The stored version means a given reset runs exactly once per install:
 * re-applying the same OTA, or reopening the app, will not wipe again.
 *
 * This is destructive and unrecoverable. Trove keeps everything on-device with
 * no sync or backup, so a bump throws away the user's real accounts and
 * transactions. Only raise this when a clean baseline is worth that.
 */
import type { OPSQLiteDatabase } from "drizzle-orm/op-sqlite";

import type { SQLiteDatabase } from "./sqlite";

import { appSettings } from "./schema";

/** Bump to force a full wipe for everyone on their next launch. */
export const DATABASE_RESET_VERSION = 1;

const RESET_VERSION_KEY = "resetVersion";

interface ResetDatabaseOptions {
  preserveExistingTablesThroughVersion?: number;
}

/**
 * Prepares an install that has not yet seen the current reset version. Existing
 * tables can be preserved while compatibility migrations run; the return value
 * then means the caller must stamp the version after successful migration.
 */
export async function resetDatabaseIfNeeded(
  db: SQLiteDatabase,
  options: ResetDatabaseOptions = {},
): Promise<boolean> {
  if ((await readResetVersion(db)) >= DATABASE_RESET_VERSION) return false;

  const tables = await userTables(db);
  const preservesThisVersion =
    options.preserveExistingTablesThroughVersion !== undefined &&
    DATABASE_RESET_VERSION <= options.preserveExistingTablesThroughVersion;
  if (!preservesThisVersion || tables.length === 0) {
    await dropAllTables(db, tables);
  }
  return true;
}

/**
 * Records the reset as done. Must run after migrations — the wipe takes
 * `app_settings` with it.
 *
 * Deliberately separate from {@link resetDatabaseIfNeeded}: if migrations throw
 * in between, the version stays unwritten and the next launch retries the whole
 * sequence rather than leaving a half-built database marked as reset.
 */
export async function markDatabaseReset(db: OPSQLiteDatabase): Promise<void> {
  await db
    .insert(appSettings)
    .values({ key: RESET_VERSION_KEY, value: String(DATABASE_RESET_VERSION) })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: { value: String(DATABASE_RESET_VERSION) },
    })
    .run();
}

async function readResetVersion(db: SQLiteDatabase): Promise<number> {
  try {
    const row = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM app_settings WHERE key = ?",
      RESET_VERSION_KEY,
    );

    return Number(row?.value) || 0;
  } catch {
    // `app_settings` does not exist yet — a fresh install. Report 0 so the
    // reset path runs: it drops nothing and simply stamps the version.
    return 0;
  }
}

async function userTables(db: SQLiteDatabase): Promise<{ name: string }[]> {
  return db.getAllAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'",
  );
}

async function dropAllTables(
  db: SQLiteDatabase,
  tables: readonly { name: string }[],
): Promise<void> {
  // Foreign keys would block dropping parents before children, and the pragma
  // is a no-op inside a transaction — so toggle it around the plain loop.
  await db.execAsync("PRAGMA foreign_keys = OFF");
  try {
    for (const { name } of tables) {
      // Includes drizzle's own migrations table, so `migrate()` replays every
      // migration and rebuilds the schema instead of assuming it is current.
      await db.execAsync(`DROP TABLE IF EXISTS "${name}"`);
    }
  } finally {
    await db.execAsync("PRAGMA foreign_keys = ON");
  }
}

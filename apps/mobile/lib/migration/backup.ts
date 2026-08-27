import { Directory, File, Paths } from "expo-file-system";
import type { SQLiteDatabase } from "expo-sqlite";

import { DB_NAME } from "@/db/constants";

/** Suffix appended to the pre-import backup file (#98, Invariant 5: archive, never delete). */
export const BACKUP_SUFFIX = ".backup";

/**
 * Copies the pre-import SQLite file aside with a `.backup` suffix before the
 * local-to-cloud migration starts. Checkpoints the WAL first so the copied
 * main file is self-consistent on its own, independent of any `-wal`/`-shm`
 * sidecar. Re-running before a previous backup is cleaned up overwrites it —
 * only the most recent pre-import snapshot needs to survive.
 */
export async function backupLocalDatabase(sqlite: SQLiteDatabase): Promise<string> {
  await sqlite.execAsync("PRAGMA wal_checkpoint(TRUNCATE);");

  const sqliteDirectory = new Directory(Paths.document, "SQLite");
  const source = new File(sqliteDirectory, DB_NAME);
  const destination = new File(sqliteDirectory, `${DB_NAME}${BACKUP_SUFFIX}`);
  if (destination.exists) {
    destination.delete();
  }
  await source.copy(destination);
  return destination.uri;
}

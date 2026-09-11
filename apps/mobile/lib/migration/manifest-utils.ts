import type { ImportManifest } from "@trove/protocol";

import { accounts } from "@/db/schema";

import type { LocalDb } from "./manifest";

export function isImportManifestEmpty(manifest: ImportManifest): boolean {
  return Object.values(manifest.rowCounts).every((count) => count === 0);
}

/** True when this device has local ledger rows worth offering a one-time upload. */
export async function localLedgerHasImportRows(db: LocalDb): Promise<boolean> {
  const row = await db.select({ id: accounts.id }).from(accounts).limit(1).get();
  return row != null;
}

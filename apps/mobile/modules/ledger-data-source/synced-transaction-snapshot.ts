import { eq } from "drizzle-orm";

import { appSettings } from "@/db/schema";
import type { LocalDb } from "@/lib/sync/outbox";

import type { SyncedAccount, SyncedCategory, SyncedTransaction } from "./synced-mappers";

export interface SyncedTransactionSnapshot {
  readonly householdId: string;
  readonly userId: string;
  readonly accounts: readonly SyncedAccount[];
  readonly categories: readonly SyncedCategory[];
  readonly transactions: readonly SyncedTransaction[];
}

const snapshotKey = (householdId: string, userId: string) =>
  `ledger.syncedTransactionSnapshot.${householdId}.${userId}`;

export async function readSyncedTransactionSnapshot(
  db: LocalDb,
  householdId: string,
  userId: string,
): Promise<SyncedTransactionSnapshot> {
  const row = await db
    .select({ value: appSettings.value })
    .from(appSettings)
    .where(eq(appSettings.key, snapshotKey(householdId, userId)))
    .get();
  if (!row) {
    throw new Error("No authoritative synced Transaction snapshot is cached for this household.");
  }

  try {
    // SAFETY: this namespaced value is written only by writeSyncedTransactionSnapshot below.
    const snapshot = JSON.parse(row.value) as SyncedTransactionSnapshot;
    if (
      snapshot.householdId !== householdId ||
      snapshot.userId !== userId ||
      !Array.isArray(snapshot.accounts) ||
      !Array.isArray(snapshot.categories) ||
      !Array.isArray(snapshot.transactions)
    ) {
      throw new Error("invalid snapshot");
    }
    return snapshot;
  } catch {
    throw new Error("The cached synced Transaction snapshot is corrupt.");
  }
}

export async function writeSyncedTransactionSnapshot(
  db: LocalDb,
  snapshot: SyncedTransactionSnapshot,
): Promise<void> {
  const value = JSON.stringify(snapshot);
  await db
    .insert(appSettings)
    .values({ key: snapshotKey(snapshot.householdId, snapshot.userId), value })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: { value },
    });
}

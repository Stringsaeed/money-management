import { eq } from "drizzle-orm";

import { appSettings } from "@/db/schema";
import { nowIso } from "@/utils/date";

import type { LocalDb } from "./manifest";

/**
 * Persisted migration flag (#98): once this device's local data has been
 * imported and its manifest matched, the household id it migrated into is
 * recorded here so the "Enable Sync" CTA never re-runs the import for the
 * same household, including across app restarts before PowerSync reconnects.
 */
export const COMPLETED_HOUSEHOLD_ID_KEY = "migration.completedHouseholdId";
const COMPLETED_AT_KEY = "migration.completedAt";

/**
 * Personal Ledger sync (#226) is opt-in per device and per User: the cloud
 * ledger starts empty, so flipping a device with local rows would hide them.
 * Recording the User id keeps the opt-in from following the next sign-in.
 */
export const PERSONAL_SYNC_USER_ID_KEY = "sync.personalLedgerUserId";

/** The household id this device last completed a matched import into, or null. */
export async function getMigratedHouseholdId(db: LocalDb): Promise<string | null> {
  const row = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, COMPLETED_HOUSEHOLD_ID_KEY))
    .get();
  return row?.value ?? null;
}

/** Records that `householdId`'s import matched and sync mode is now active for it. */
export async function markMigrationCompleted(db: LocalDb, householdId: string): Promise<void> {
  const completedAt = nowIso();
  await db
    .insert(appSettings)
    .values({ key: COMPLETED_HOUSEHOLD_ID_KEY, value: householdId })
    .onConflictDoUpdate({ target: appSettings.key, set: { value: householdId } });
  await db
    .insert(appSettings)
    .values({ key: COMPLETED_AT_KEY, value: completedAt })
    .onConflictDoUpdate({ target: appSettings.key, set: { value: completedAt } });
}

/** The User whose Personal Ledger this device syncs, or null if none. */
export async function getPersonalSyncUserId(db: LocalDb): Promise<string | null> {
  const row = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, PERSONAL_SYNC_USER_ID_KEY))
    .get();
  return row?.value ?? null;
}

/** Records that this device now reads and writes `userId`'s Personal Ledger. */
export async function markPersonalSyncEnabled(db: LocalDb, userId: string): Promise<void> {
  await db
    .insert(appSettings)
    .values({ key: PERSONAL_SYNC_USER_ID_KEY, value: userId })
    .onConflictDoUpdate({ target: appSettings.key, set: { value: userId } });
}

/** Reads both sync opt-ins in one pass so the gate renders from one query. */
export async function getSyncEnrollment(
  db: LocalDb,
): Promise<{ migratedHouseholdId: string | null; personalSyncUserId: string | null }> {
  const [migratedHouseholdId, personalSyncUserId] = await Promise.all([
    getMigratedHouseholdId(db),
    getPersonalSyncUserId(db),
  ]);
  return { migratedHouseholdId, personalSyncUserId };
}

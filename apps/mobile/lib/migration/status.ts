import { eq } from "drizzle-orm";

import { appSettings } from "@/db/schema";
import { nowIso } from "@/utils/date";

import type { LocalDb } from "./manifest";

/**
 * Persisted migration flag (#98): once this device's local data has been
 * imported and its manifest matched, the household id it migrated into is
 * recorded here so the "Enable Sync" CTA never re-runs the import for the
 * same household — even across app restarts, before `sync_state` has any
 * watermark of its own.
 */
export const COMPLETED_HOUSEHOLD_ID_KEY = "migration.completedHouseholdId";
const COMPLETED_AT_KEY = "migration.completedAt";

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

import { drizzle } from "drizzle-orm/expo-sqlite";
import type { SQLiteDatabase } from "expo-sqlite";

import type { LocalDb } from "@/lib/migration/manifest";
import { getMigratedHouseholdId } from "@/lib/migration/status";
import { getSystemTimeZone, localDateInTimeZone } from "@/modules/recurring-rules/clock";

import { migrateAccountLifecycle } from "./account-lifecycle-migration";
import { migrateBudgeting } from "./budgeting-migration";
import { migrateCategoryLifecycle } from "./category-lifecycle-migration";
import { runMigrations } from "./migrate";
import { migrateRecurringRules } from "./recurring-rules-migration";
import { markDatabaseReset, resetDatabaseIfNeeded } from "./reset";
import * as schema from "./schema";
import { seedDatabase } from "./seed";

interface InitializeDatabaseOptions {
  migrationInstant?: Date;
  timeZone?: string;
}

const BUDGETING_PRESERVATION_RESET_VERSION = 1;

export async function initializeDatabase(
  database: SQLiteDatabase,
  options: InitializeDatabaseOptions = {},
): Promise<void> {
  const drizzleDatabase = drizzle(database);
  const shouldMarkReset = await resetDatabaseIfNeeded(database, {
    preserveExistingTablesThroughVersion: BUDGETING_PRESERVATION_RESET_VERSION,
  });

  await runMigrations(drizzleDatabase);

  const migrationInstant = options.migrationInstant ?? new Date();
  const timeZone = options.timeZone ?? getSystemTimeZone();
  await migrateRecurringRules(database, {
    timeZone,
    localDate: localDateInTimeZone(migrationInstant, timeZone),
    now: migrationInstant.toISOString(),
  });
  await migrateBudgeting(database);
  await migrateCategoryLifecycle(database);
  await migrateAccountLifecycle(database);

  if (shouldMarkReset) await markDatabaseReset(drizzleDatabase);
  if (await shouldSeedDefaultCategories(drizzle(database, { schema }) as LocalDb)) {
    await seedDatabase(drizzleDatabase);
  }
}

/** False once Enable Sync recorded a migrated household; keeps seed off the twin ledger. */
export async function shouldSeedDefaultCategories(db: LocalDb): Promise<boolean> {
  return (await getMigratedHouseholdId(db)) == null;
}

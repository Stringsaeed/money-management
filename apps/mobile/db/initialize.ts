import { drizzle } from "drizzle-orm/expo-sqlite";
import type { SQLiteDatabase } from "expo-sqlite";

import { getSystemTimeZone, localDateInTimeZone } from "@/modules/recurring-rules/clock";

import { migrateBudgeting } from "./budgeting-migration";
import { runMigrations } from "./migrate";
import { migrateRecurringRules } from "./recurring-rules-migration";
import { markDatabaseReset, resetDatabaseIfNeeded } from "./reset";
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

  if (shouldMarkReset) await markDatabaseReset(drizzleDatabase);
  await seedDatabase(drizzleDatabase);
}

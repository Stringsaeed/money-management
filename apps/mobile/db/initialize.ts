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

export async function initializeDatabase(
  database: SQLiteDatabase,
  options: InitializeDatabaseOptions = {},
): Promise<void> {
  const drizzleDatabase = drizzle(database);
  const didReset = await resetDatabaseIfNeeded(database);

  await runMigrations(drizzleDatabase);

  const migrationInstant = options.migrationInstant ?? new Date();
  const timeZone = options.timeZone ?? getSystemTimeZone();
  await migrateRecurringRules(database, {
    timeZone,
    localDate: localDateInTimeZone(migrationInstant, timeZone),
    now: migrationInstant.toISOString(),
  });
  await migrateBudgeting(database);

  if (didReset) await markDatabaseReset(drizzleDatabase);
  await seedDatabase(drizzleDatabase);
}

import { type ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import { migrate } from "drizzle-orm/expo-sqlite/migrator";

import { appSettings } from "./schema";
import migrations from "./migrations/migrations";

// ── Default app settings ────────────────────────────────────────────────────

const DEFAULT_SETTINGS: { key: string; value: string }[] = [
  { key: "homeCurrency", value: "USD" },
  { key: "dateFormat", value: "MM/DD/YYYY" },
  { key: "firstDayOfWeek", value: "0" },
];

async function seedDefaultSettings(db: ExpoSQLiteDatabase) {
  for (const setting of DEFAULT_SETTINGS) {
    await db.insert(appSettings).values(setting).onConflictDoNothing().run();
  }
}

export async function runMigrations(db: ExpoSQLiteDatabase) {
  await migrate(db, migrations);
  await seedDefaultSettings(db);
}

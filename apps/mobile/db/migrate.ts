import { type OPSQLiteDatabase } from "drizzle-orm/op-sqlite";
import { migrate } from "drizzle-orm/op-sqlite/migrator";

import { appSettings } from "./schema";
import migrations from "./migrations/migrations";

// ── Default app settings ────────────────────────────────────────────────────

const DEFAULT_SETTINGS: { key: string; value: string }[] = [
  { key: "homeCurrency", value: "USD" },
  { key: "dateFormat", value: "MM/DD/YYYY" },
  { key: "firstDayOfWeek", value: "0" },
];

async function seedDefaultSettings(db: OPSQLiteDatabase) {
  for (const setting of DEFAULT_SETTINGS) {
    await db.insert(appSettings).values(setting).onConflictDoNothing().run();
  }
}

export async function runMigrations(db: OPSQLiteDatabase) {
  await migrate(db, migrations);
  await seedDefaultSettings(db);
}

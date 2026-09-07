import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";

import type { createDb } from "@trove/db";

const SKIP_BASELINE = /CREATE ROLE|CREATE PUBLICATION|GRANT |ALTER PUBLICATION|ALTER ROLE/;

export async function createTestDb(): Promise<ReturnType<typeof createDb>> {
  const client = new PGlite();
  const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), "../../../db/src/migrations");
  const migrationFiles = readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();
  for (const file of migrationFiles) {
    const sql = readFileSync(join(migrationsDir, file), "utf8");
    for (const statement of sql.split("--> statement-breakpoint")) {
      const trimmed = statement.trim();
      if (!trimmed || SKIP_BASELINE.test(trimmed)) {
        continue;
      }
      await client.exec(trimmed);
    }
  }
  return drizzle({ client }) as unknown as ReturnType<typeof createDb>;
}

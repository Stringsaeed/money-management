import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import type { createDb } from "@trove/db";

/**
 * Builds a fresh in-memory SQLite database with all D1 migrations applied and
 * returns it typed as the pipeline's database port. libsql speaks the same
 * dialect and batch semantics as D1 for the statements the pipeline issues,
 * so production code is exercised unchanged.
 */
export async function createTestDb(): Promise<ReturnType<typeof createDb>> {
  const client: Client = createClient({ url: ":memory:" });
  const migrationsDir = join(
    dirname(fileURLToPath(import.meta.url)),
    "../../../../db/src/migrations",
  );
  const migrationFiles = readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();
  for (const file of migrationFiles) {
    // Drizzle marks split points; libsql runs the statements fine separated.
    const sql = readFileSync(join(migrationsDir, file), "utf8");
    await client.executeMultiple(sql.replaceAll("--> statement-breakpoint", ";"));
  }
  return drizzle(client) as unknown as ReturnType<typeof createDb>;
}

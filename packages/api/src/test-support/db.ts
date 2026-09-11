import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";

import type { createDb } from "@trove/db";

const PGLITE_SKIP_REPLICATION_DDL =
  /CREATE ROLE|CREATE PUBLICATION|GRANT |ALTER PUBLICATION|ALTER ROLE/;

/**
 * Test-only convenience: production writes the organization `ledger` row in
 * the same transaction as the `household` row (households router). Tests that
 * seed a `household` directly to exercise the ledger pipeline get the ledger
 * row mirrored for them so the seed stays one insert.
 */
const TEST_HOUSEHOLD_LEDGER_MIRROR = `
CREATE OR REPLACE FUNCTION test_mirror_household_ledger() RETURNS trigger AS $$
BEGIN
  INSERT INTO "ledger" ("id", "kind", "organization_id", "created_at", "updated_at")
  VALUES (NEW."id", 'organization', NEW."id", NEW."created_at", NEW."created_at")
  ON CONFLICT ("id") DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER test_household_mirror_ledger AFTER INSERT ON "household"
  FOR EACH ROW EXECUTE FUNCTION test_mirror_household_ledger();
`;

export interface TestDbOptions {
  /** Mirror an organization ledger row for every seeded household (default true). */
  readonly householdLedgerMirror?: boolean;
}

export async function createTestDb(
  options: TestDbOptions = {},
): Promise<ReturnType<typeof createDb>> {
  const client = new PGlite();
  const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), "../../../db/src/migrations");
  const migrationFiles = readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();
  for (const file of migrationFiles) {
    const sql = readFileSync(join(migrationsDir, file), "utf8");
    for (const statement of sql.split("--> statement-breakpoint")) {
      const trimmed = statement.trim();
      if (!trimmed || PGLITE_SKIP_REPLICATION_DDL.test(trimmed)) {
        continue;
      }
      await client.exec(trimmed);
    }
  }
  if (options.householdLedgerMirror ?? true) {
    await client.exec(TEST_HOUSEHOLD_LEDGER_MIRROR);
  }
  return drizzle({ client }) as unknown as ReturnType<typeof createDb>;
}

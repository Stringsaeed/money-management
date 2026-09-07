import { drizzle } from "drizzle-orm/op-sqlite";
import type { OPSQLiteDatabase } from "drizzle-orm/op-sqlite";
import type { SQLiteDatabase } from "@/db/sqlite";

import * as schema from "@/db/schema";
import { applyLegacyMigrations, createTestSQLiteDatabase } from "@/tests/test-utils/sqlite";

import { getMigratedHouseholdId, markMigrationCompleted } from "./status";
import type { LocalDb } from "./manifest";

type TestSQLiteDatabase = ReturnType<typeof createTestSQLiteDatabase>;

const databases: TestSQLiteDatabase[] = [];

afterEach(() => {
  databases.splice(0).forEach(({ close }) => close());
});

async function setupDb(): Promise<LocalDb> {
  const testDatabase = createTestSQLiteDatabase();
  databases.push(testDatabase);
  await applyLegacyMigrations(testDatabase.database);
  return drizzle(testDatabase.database, { schema }) as LocalDb & {
    $client: SQLiteDatabase;
  } & OPSQLiteDatabase<typeof schema>;
}

describe("migration status", () => {
  it("has no completed migration before one is recorded", async () => {
    const db = await setupDb();
    expect(await getMigratedHouseholdId(db)).toBeNull();
  });

  it("persists the completed household id and survives re-reads", async () => {
    const db = await setupDb();
    await markMigrationCompleted(db, "household-1");
    expect(await getMigratedHouseholdId(db)).toBe("household-1");
  });

  it("overwrites an earlier completion if run again for a different household", async () => {
    const db = await setupDb();
    await markMigrationCompleted(db, "household-1");
    await markMigrationCompleted(db, "household-2");
    expect(await getMigratedHouseholdId(db)).toBe("household-2");
  });
});

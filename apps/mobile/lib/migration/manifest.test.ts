import { drizzle } from "drizzle-orm/expo-sqlite";
import type { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import type { SQLiteDatabase } from "expo-sqlite";

import { migrateAccountLifecycle } from "@/db/account-lifecycle-migration";
import { migrateBudgeting } from "@/db/budgeting-migration";
import { migrateCategoryLifecycle } from "@/db/category-lifecycle-migration";
import { migrateRecurringRules } from "@/db/recurring-rules-migration";
import * as schema from "@/db/schema";
import { accounts, categories, transactions } from "@/db/schema";
import { applyLegacyMigrations, createTestSQLiteDatabase } from "@/tests/test-utils/sqlite";

import { computeLocalManifest, type LocalDb } from "./manifest";

type TestSQLiteDatabase = ReturnType<typeof createTestSQLiteDatabase>;

const databases: TestSQLiteDatabase[] = [];

afterEach(() => {
  databases.splice(0).forEach(({ close }) => close());
});

async function setupDb(): Promise<LocalDb> {
  const testDatabase = createTestSQLiteDatabase();
  databases.push(testDatabase);
  await applyLegacyMigrations(testDatabase.database);
  await migrateRecurringRules(testDatabase.database, {
    timeZone: "Asia/Dubai",
    localDate: "2026-08-18",
    now: "2026-08-18T08:00:00.000Z",
  });
  await migrateBudgeting(testDatabase.database);
  await migrateAccountLifecycle(testDatabase.database);
  await migrateCategoryLifecycle(testDatabase.database);
  return drizzle(testDatabase.database, { schema }) as LocalDb & {
    $client: SQLiteDatabase;
  } & ExpoSQLiteDatabase<typeof schema>;
}

describe("computeLocalManifest", () => {
  it("counts ledger facts and sums transactions by account", async () => {
    const db = await setupDb();

    await db.insert(accounts).values([
      {
        id: "account-1",
        name: "Checking",
        type: "bank",
        currency: "USD",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "account-2",
        name: "Euro account",
        type: "bank",
        currency: "EUR",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "account-3",
        name: "Savings",
        type: "bank",
        currency: "USD",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ]);
    await db.insert(categories).values({
      id: "category-1",
      name: "Groceries",
      type: "expense",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    await db.insert(transactions).values([
      {
        id: "txn-1",
        type: "expense",
        amount: 1_000,
        currency: "USD",
        date: "2026-01-05",
        accountId: "account-1",
        createdAt: "2026-01-05T00:00:00.000Z",
        updatedAt: "2026-01-05T00:00:00.000Z",
      },
      {
        id: "txn-2",
        type: "expense",
        amount: 500,
        currency: "USD",
        date: "2026-01-06",
        accountId: "account-1",
        createdAt: "2026-01-06T00:00:00.000Z",
        updatedAt: "2026-01-06T00:00:00.000Z",
      },
      {
        id: "txn-3",
        type: "expense",
        amount: 2_000,
        currency: "EUR",
        date: "2026-01-07",
        accountId: "account-2",
        createdAt: "2026-01-07T00:00:00.000Z",
        updatedAt: "2026-01-07T00:00:00.000Z",
      },
      {
        id: "txn-4",
        type: "expense",
        amount: 300,
        currency: "USD",
        date: "2026-01-08",
        accountId: "account-3",
        createdAt: "2026-01-08T00:00:00.000Z",
        updatedAt: "2026-01-08T00:00:00.000Z",
      },
    ]);
    const manifest = await computeLocalManifest(db);

    expect(manifest.rowCounts).toEqual({
      account: 3,
      category: 1,
      transaction: 4,
    });
    expect(manifest.transactionAmountMinorByAccount).toEqual({
      "account-1": 1_500,
      "account-2": 2_000,
      "account-3": 300,
    });
  });

  it("returns zeroed counts and empty sums for an empty install", async () => {
    const db = await setupDb();
    const manifest = await computeLocalManifest(db);
    expect(Object.values(manifest.rowCounts).every((count) => count === 0)).toBe(true);
    expect(manifest.transactionAmountMinorByAccount).toEqual({});
  });
});

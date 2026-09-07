import { drizzle } from "drizzle-orm/op-sqlite";
import type { OPSQLiteDatabase } from "drizzle-orm/op-sqlite";
import type { SQLiteDatabase } from "@/db/sqlite";
import { MAX_IMPORT_CHUNK_ROWS, type ImportBundlePayload } from "@trove/protocol";

import { migrateAccountLifecycle } from "@/db/account-lifecycle-migration";
import { migrateBudgeting } from "@/db/budgeting-migration";
import { migrateCategoryLifecycle } from "@/db/category-lifecycle-migration";
import { migrateRecurringRules } from "@/db/recurring-rules-migration";
import * as schema from "@/db/schema";
import { accounts, categories, transactions } from "@/db/schema";
import { applyLegacyMigrations, createTestSQLiteDatabase } from "@/tests/test-utils/sqlite";

import { buildImportChunks } from "./chunks";
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
  } & OPSQLiteDatabase<typeof schema>;
}

function entityTypesInOrder(chunks: readonly ImportBundlePayload[]): readonly string[] {
  const seen: string[] = [];
  for (const chunk of chunks) {
    if (!seen.includes(chunk.entityType)) {
      seen.push(chunk.entityType);
    }
  }
  return seen;
}

describe("buildImportChunks", () => {
  it("skips entity types with no local rows", async () => {
    const db = await setupDb();
    const chunks = await buildImportChunks(db);
    expect(chunks).toEqual([]);
  });

  it("renames local ledger fields onto the server's wire shape", async () => {
    const db = await setupDb();
    await db.insert(accounts).values({
      id: "account-1",
      name: "Checking",
      type: "bank",
      currency: "USD",
      initialBalance: 5_000,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    await db.insert(transactions).values({
      id: "txn-1",
      type: "expense",
      amount: 1_200,
      originalAmount: 1_000,
      originalCurrency: "EUR",
      currency: "USD",
      date: "2026-01-05",
      accountId: "account-1",
      createdAt: "2026-01-05T00:00:00.000Z",
      updatedAt: "2026-01-05T00:00:00.000Z",
    });

    const chunks = await buildImportChunks(db);
    const accountChunk = chunks.find((chunk) => chunk.entityType === "account");
    const transactionChunk = chunks.find((chunk) => chunk.entityType === "transaction");

    expect(accountChunk?.rows[0]).toMatchObject({ id: "account-1", initialBalanceMinor: 5_000 });
    expect(accountChunk?.rows[0]).not.toHaveProperty("initialBalance");
    expect(transactionChunk?.rows[0]).toMatchObject({
      id: "txn-1",
      amountMinor: 1_200,
      originalAmountMinor: 1_000,
    });
    expect(transactionChunk?.rows[0]).not.toHaveProperty("amount");
  });

  it("maps local account types onto cash|bank|card for import_bundle", async () => {
    const db = await setupDb();
    await db.insert(accounts).values([
      {
        id: "checking-1",
        name: "Everyday",
        type: "checking",
        currency: "USD",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "savings-1",
        name: "Nest",
        type: "savings",
        currency: "USD",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "cash-1",
        name: "Wallet",
        type: "cash",
        currency: "USD",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "card-1",
        name: "Visa",
        type: "credit_card",
        currency: "USD",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "invest-1",
        name: "Brokerage",
        type: "investment",
        currency: "USD",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "other-1",
        name: "Misc",
        type: "other",
        currency: "USD",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ]);

    const accountChunks = (await buildImportChunks(db)).filter(
      (chunk) => chunk.entityType === "account",
    );
    const byId = new Map(
      accountChunks.flatMap((chunk) => chunk.rows.map((row) => [row.id, row.type] as const)),
    );

    expect(byId.get("checking-1")).toBe("bank");
    expect(byId.get("savings-1")).toBe("bank");
    expect(byId.get("cash-1")).toBe("cash");
    expect(byId.get("card-1")).toBe("card");
    expect(byId.get("invest-1")).toBe("bank");
    expect(byId.get("other-1")).toBe("bank");
  });

  it("splits seeded category volume into D1-safe chunk sizes", async () => {
    const db = await setupDb();
    const total = 11;
    await db.insert(categories).values(
      Array.from({ length: total }, (_, i) => ({
        id: `category-${i}`,
        name: `Category ${i}`,
        type: "expense" as const,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      })),
    );

    const chunks = (await buildImportChunks(db)).filter((chunk) => chunk.entityType === "category");
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.rows.length).toBeLessThanOrEqual(MAX_IMPORT_CHUNK_ROWS);
    }
    expect(chunks.flatMap((chunk) => chunk.rows)).toHaveLength(total);
  });

  it("orders chunks account -> category -> transaction", async () => {
    const db = await setupDb();
    await db.insert(accounts).values({
      id: "account-1",
      name: "Checking",
      type: "bank",
      currency: "USD",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    await db.insert(categories).values({
      id: "category-1",
      name: "Groceries",
      type: "expense",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    await db.insert(transactions).values({
      id: "txn-1",
      type: "expense",
      amount: 1_200,
      currency: "USD",
      date: "2026-01-05",
      accountId: "account-1",
      categoryId: "category-1",
      createdAt: "2026-01-05T00:00:00.000Z",
      updatedAt: "2026-01-05T00:00:00.000Z",
    });
    const chunks = await buildImportChunks(db);
    expect(entityTypesInOrder(chunks)).toEqual(["account", "category", "transaction"]);
  });

  it("splits a large table across chunks and preserves every row exactly once", async () => {
    const db = await setupDb();
    const total = MAX_IMPORT_CHUNK_ROWS + 5;
    await db.insert(accounts).values(
      Array.from({ length: total }, (_, i) => ({
        id: `account-${i}`,
        name: `Account ${i}`,
        type: "bank" as const,
        currency: "USD",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      })),
    );

    const chunks = (await buildImportChunks(db)).filter((chunk) => chunk.entityType === "account");
    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toMatchObject({ chunkIndex: 0, chunkCount: 2 });
    expect(chunks[1]).toMatchObject({ chunkIndex: 1, chunkCount: 2 });
    expect(chunks[0]?.rows).toHaveLength(MAX_IMPORT_CHUNK_ROWS);
    expect(chunks[1]?.rows).toHaveLength(5);

    const allIds = chunks.flatMap((chunk) => chunk.rows.map((row) => row.id));
    expect(new Set(allIds).size).toBe(total);
  });
});

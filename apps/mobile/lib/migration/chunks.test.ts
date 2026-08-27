import { drizzle } from "drizzle-orm/expo-sqlite";
import type { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import type { SQLiteDatabase } from "expo-sqlite";
import { MAX_IMPORT_CHUNK_ROWS, type ImportBundlePayload } from "@trove/protocol";

import { migrateAccountLifecycle } from "@/db/account-lifecycle-migration";
import { migrateBudgeting } from "@/db/budgeting-migration";
import { migrateCategoryLifecycle } from "@/db/category-lifecycle-migration";
import { migrateRecurringRules } from "@/db/recurring-rules-migration";
import * as schema from "@/db/schema";
import {
  accounts,
  budgetWorkspaces,
  categories,
  categoryMappings,
  envelopes,
  fundingMemberships,
  transactions,
} from "@/db/schema";
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
  } & ExpoSQLiteDatabase<typeof schema>;
}

/** Groups chunks by entity type, in the order they were produced. */
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

  it("orders chunks account -> category -> transaction -> budgeting facts", async () => {
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
    await db.insert(budgetWorkspaces).values({
      currency: "USD",
      activationPeriod: "2026-01",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    await db.insert(envelopes).values({
      id: "envelope-1",
      currency: "USD",
      name: "Groceries",
      icon: "🛒",
      color: "#8B9D83",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    await db.insert(categoryMappings).values({
      categoryId: "category-1",
      envelopeId: "envelope-1",
      effectiveFromPeriod: "2026-01",
      createdAt: "2026-01-01T00:00:00.000Z",
    });

    const chunks = await buildImportChunks(db);
    expect(entityTypesInOrder(chunks)).toEqual([
      "account",
      "category",
      "transaction",
      "budgetWorkspace",
      "envelope",
      "categoryMapping",
    ]);
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

  it("drops the client-only effectiveToPeriod column from category mappings", async () => {
    const db = await setupDb();
    await db.insert(categories).values({
      id: "category-1",
      name: "Groceries",
      type: "expense",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    await db.insert(budgetWorkspaces).values({
      currency: "USD",
      activationPeriod: "2026-01",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    await db.insert(envelopes).values({
      id: "envelope-1",
      currency: "USD",
      name: "Groceries",
      icon: "🛒",
      color: "#8B9D83",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    await db.insert(categoryMappings).values({
      categoryId: "category-1",
      envelopeId: "envelope-1",
      effectiveFromPeriod: "2026-01",
      effectiveToPeriod: "2026-06",
      createdAt: "2026-01-01T00:00:00.000Z",
    });

    const chunks = await buildImportChunks(db);
    const mappingChunk = chunks.find((chunk) => chunk.entityType === "categoryMapping");
    expect(mappingChunk?.rows[0]).not.toHaveProperty("effectiveToPeriod");
    expect(mappingChunk?.rows[0]).toMatchObject({ effectiveFromPeriod: "2026-01" });
  });

  it("expands an ended funding membership into an active row plus a tombstone", async () => {
    const db = await setupDb();
    await db.insert(accounts).values({
      id: "account-1",
      name: "Checking",
      type: "bank",
      currency: "USD",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    await db.insert(budgetWorkspaces).values({
      currency: "USD",
      activationPeriod: "2026-01",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    await db.insert(fundingMemberships).values({
      accountId: "account-1",
      currency: "USD",
      effectiveFromPeriod: "2026-01",
      effectiveToPeriod: "2026-03",
      createdAt: "2026-01-01T00:00:00.000Z",
    });

    const chunks = await buildImportChunks(db);
    const membershipChunk = chunks.find((chunk) => chunk.entityType === "fundingMembership");
    expect(membershipChunk?.rows).toEqual([
      {
        accountId: "account-1",
        currency: "USD",
        active: true,
        effectiveFromPeriod: "2026-01",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      {
        accountId: "account-1",
        currency: "USD",
        active: false,
        effectiveFromPeriod: "2026-04",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ]);
  });

  it("keeps an open-ended funding membership as a single active row", async () => {
    const db = await setupDb();
    await db.insert(accounts).values({
      id: "account-1",
      name: "Checking",
      type: "bank",
      currency: "USD",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    await db.insert(budgetWorkspaces).values({
      currency: "USD",
      activationPeriod: "2026-01",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    await db.insert(fundingMemberships).values({
      accountId: "account-1",
      currency: "USD",
      effectiveFromPeriod: "2026-01",
      createdAt: "2026-01-01T00:00:00.000Z",
    });

    const chunks = await buildImportChunks(db);
    const membershipChunk = chunks.find((chunk) => chunk.entityType === "fundingMembership");
    expect(membershipChunk?.rows).toEqual([
      {
        accountId: "account-1",
        currency: "USD",
        active: true,
        effectiveFromPeriod: "2026-01",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ]);
  });
});

import { drizzle } from "drizzle-orm/expo-sqlite";
import type { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import type { SQLiteDatabase } from "expo-sqlite";
import type {
  CommandEnvelope,
  CommandResult,
  ImportBundlePayload,
  ImportManifest,
} from "@trove/protocol";

import { migrateAccountLifecycle } from "@/db/account-lifecycle-migration";
import { migrateBudgeting } from "@/db/budgeting-migration";
import { migrateCategoryLifecycle } from "@/db/category-lifecycle-migration";
import { migrateRecurringRules } from "@/db/recurring-rules-migration";
import * as schema from "@/db/schema";
import { accounts } from "@/db/schema";
import { applyLegacyMigrations, createTestSQLiteDatabase } from "@/tests/test-utils/sqlite";

import { runImport } from "./enable-sync";
import type { LocalDb } from "./manifest";

type TestSQLiteDatabase = ReturnType<typeof createTestSQLiteDatabase>;

const HOUSEHOLD_ID = "household-1";

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
  const db = drizzle(testDatabase.database, { schema }) as LocalDb & {
    $client: SQLiteDatabase;
  } & ExpoSQLiteDatabase<typeof schema>;
  await db.insert(accounts).values({
    id: "account-1",
    name: "Checking",
    type: "bank",
    currency: "USD",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  });
  return db;
}

const MATCHING_MANIFEST: ImportManifest = {
  rowCounts: {
    account: 1,
    category: 0,
    recurringRule: 0,
    recurringOccurrence: 0,
    transaction: 0,
    budgetWorkspace: 0,
    envelope: 0,
    categoryMapping: 0,
    fundingMembership: 0,
    rolloverSetting: 0,
    assignment: 0,
  },
  transactionAmountMinorByAccount: {},
  assignmentAmountMinorByCurrency: {},
};

const APPLIED_RESULT: CommandResult = {
  kind: "applied",
  seq: 1,
  effects: [],
  applied: {},
  replayed: false,
};

describe("runImport", () => {
  it("uploads every chunk in order and reports a match when manifests agree", async () => {
    const db = await setupDb();
    const sent: CommandEnvelope<ImportBundlePayload>[] = [];
    const result = await runImport({
      db,
      householdId: HOUSEHOLD_ID,
      sendCommand: async (envelope) => {
        sent.push(envelope);
        return APPLIED_RESULT;
      },
      fetchManifest: async () => MATCHING_MANIFEST,
    });

    expect(result.status).toBe("matched");
    expect(sent).toHaveLength(1);
    expect(sent[0]?.householdId).toBe(HOUSEHOLD_ID);
    expect(sent[0]?.kind).toBe("import_bundle");
    expect(sent[0]?.payload.entityType).toBe("account");
  });

  it("stops uploading and reports rejected at the first non-applied result", async () => {
    const db = await setupDb();
    await db.insert(schema.categories).values({
      id: "category-1",
      name: "Groceries",
      type: "expense",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    let calls = 0;
    const rejection: CommandResult = { kind: "forbidden", role: "member", requiredCapability: "x" };
    const result = await runImport({
      db,
      householdId: HOUSEHOLD_ID,
      sendCommand: async () => {
        calls += 1;
        return calls === 1 ? APPLIED_RESULT : rejection;
      },
      fetchManifest: async () => MATCHING_MANIFEST,
    });

    expect(result.status).toBe("rejected");
    expect(calls).toBe(2);
    if (result.status === "rejected") {
      expect(result.entityType).toBe("category");
    }
  });

  it("reports mismatched without throwing when manifests disagree", async () => {
    const db = await setupDb();
    const result = await runImport({
      db,
      householdId: HOUSEHOLD_ID,
      sendCommand: async () => APPLIED_RESULT,
      fetchManifest: async () => ({
        ...MATCHING_MANIFEST,
        rowCounts: { ...MATCHING_MANIFEST.rowCounts, account: 0 },
      }),
    });

    expect(result.status).toBe("mismatched");
  });
});

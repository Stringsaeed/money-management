import { drizzle } from "drizzle-orm/op-sqlite";
import type { OPSQLiteDatabase } from "drizzle-orm/op-sqlite";
import type { SQLiteDatabase } from "@/db/sqlite";
import type {
  CommandEnvelope,
  CommandResult,
  ImportBundlePayload,
  ImportManifest,
} from "@trove/protocol";
import { personalLedgerId } from "@trove/protocol";

import { migrateAccountLifecycle } from "@/db/account-lifecycle-migration";
import { migrateBudgeting } from "@/db/budgeting-migration";
import { migrateCategoryLifecycle } from "@/db/category-lifecycle-migration";
import { migrateRecurringRules } from "@/db/recurring-rules-migration";
import * as schema from "@/db/schema";
import { accounts } from "@/db/schema";
import { applyLegacyMigrations, createTestSQLiteDatabase } from "@/tests/test-utils/sqlite";

import { personalImportBinding } from "./import-binding";
import { runImport } from "./enable-sync";
import { computeLocalManifest, type LocalDb } from "./manifest";

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
  } & OPSQLiteDatabase<typeof schema>;
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
    assignment: 0,
    budget_workspace: 0,
    category: 0,
    category_mapping: 0,
    envelope: 0,
    funding_membership: 0,
    recurring_occurrence: 0,
    recurring_rule: 0,
    rollover_setting: 0,
    transaction: 0,
  },
  transactionAmountMinorByAccount: {},
  contentDigest: "matching-digest",
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
    const matchingManifest = await computeLocalManifest(db, HOUSEHOLD_ID);
    const sent: CommandEnvelope<ImportBundlePayload>[] = [];
    const connectAndWait = jest.fn(async () => undefined);
    const result = await runImport({
      db,
      binding: { kind: "household", householdId: HOUSEHOLD_ID, ledgerId: HOUSEHOLD_ID },
      sendCommand: async (envelope) => {
        sent.push(envelope);
        return APPLIED_RESULT;
      },
      fetchManifest: async () => matchingManifest,
      connectAndWait,
    });

    expect(result.status).toBe("matched");
    expect(sent).toHaveLength(1);
    expect(sent[0]?.householdId).toBe(HOUSEHOLD_ID);
    expect(sent[0]?.kind).toBe("import_bundle");
    expect(sent[0]?.payload.entityType).toBe("account");
    expect(connectAndWait).toHaveBeenCalledTimes(1);
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
      binding: { kind: "household", householdId: HOUSEHOLD_ID, ledgerId: HOUSEHOLD_ID },
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
      binding: { kind: "household", householdId: HOUSEHOLD_ID, ledgerId: HOUSEHOLD_ID },
      sendCommand: async () => APPLIED_RESULT,
      fetchManifest: async () => ({
        ...MATCHING_MANIFEST,
        rowCounts: { ...MATCHING_MANIFEST.rowCounts, account: 0 },
      }),
    });

    expect(result.status).toBe("mismatched");
  });

  it("does not certify when the local ledger changes during upload", async () => {
    const db = await setupDb();
    const uploadedSnapshot = await computeLocalManifest(db, HOUSEHOLD_ID);
    const result = await runImport({
      db,
      binding: { kind: "household", householdId: HOUSEHOLD_ID, ledgerId: HOUSEHOLD_ID },
      sendCommand: async () => {
        await db.insert(schema.categories).values({
          id: "category-during-import",
          name: "Changed locally",
          type: "expense",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        });
        return APPLIED_RESULT;
      },
      fetchManifest: async () => uploadedSnapshot,
    });

    expect(result.status).toBe("mismatched");
    if (result.status === "mismatched") {
      expect(result.localManifest.rowCounts.category).toBe(1);
      expect(result.serverManifest.rowCounts.category).toBe(0);
    }
  });

  it("sends personal scope on personal import binding", async () => {
    const db = await setupDb();
    const matchingManifest = await computeLocalManifest(db, personalLedgerId("user-1"));
    const sent: CommandEnvelope<ImportBundlePayload>[] = [];
    await runImport({
      db,
      binding: personalImportBinding("user-1"),
      sendCommand: async (envelope) => {
        sent.push(envelope);
        return APPLIED_RESULT;
      },
      fetchManifest: async () => matchingManifest,
    });

    expect(sent[0]?.scope).toEqual({ type: "personal" });
    expect(sent[0]?.householdId).toBeUndefined();
  });
});

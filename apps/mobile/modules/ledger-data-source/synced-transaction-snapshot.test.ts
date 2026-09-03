import { drizzle } from "drizzle-orm/expo-sqlite";
import type { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import type { SQLiteDatabase } from "expo-sqlite";

import * as schema from "@/db/schema";
import { createTestSQLiteDatabase, type TestSQLiteDatabase } from "@/tests/test-utils/sqlite";
import {
  readSyncedTransactionSnapshot,
  writeSyncedTransactionSnapshot,
  type SyncedTransactionSnapshot,
} from "./synced-transaction-snapshot";

type LocalDb = ExpoSQLiteDatabase<typeof schema> & { $client: SQLiteDatabase };

const databases: TestSQLiteDatabase[] = [];

const setup = async (): Promise<{ db: LocalDb; sqlite: SQLiteDatabase }> => {
  const testDatabase = createTestSQLiteDatabase();
  databases.push(testDatabase);
  await testDatabase.database.execAsync(
    "CREATE TABLE app_settings (key text PRIMARY KEY NOT NULL, value text NOT NULL)",
  );
  return {
    db: drizzle(testDatabase.database, { schema }),
    sqlite: testDatabase.database,
  };
};

afterEach(() => {
  databases.splice(0).forEach(({ close }) => close());
});

describe("synced Transaction snapshot", () => {
  it("survives a data-source restart for the same household and user", async () => {
    const { db, sqlite } = await setup();
    const snapshot: SyncedTransactionSnapshot = {
      householdId: "household-1",
      userId: "user-1",
      accounts: [],
      categories: [],
      transactions: [],
    };

    await writeSyncedTransactionSnapshot(db, snapshot);
    const restartedDb = drizzle(sqlite, { schema });

    await expect(
      readSyncedTransactionSnapshot(restartedDb, "household-1", "user-1"),
    ).resolves.toEqual(snapshot);
    await expect(
      readSyncedTransactionSnapshot(restartedDb, "household-1", "user-2"),
    ).rejects.toThrow("No authoritative");
  });

  it("prunes Transactions whose Accounts leave the authorized set", async () => {
    const { db } = await setup();
    const timestamp = "2026-01-01T00:00:00.000Z";
    await writeSyncedTransactionSnapshot(db, {
      householdId: "household-1",
      userId: "user-1",
      accounts: [
        {
          householdId: "household-1",
          id: "cash",
          name: "Cash",
          type: "bank",
          currency: "USD",
          color: "#000",
          icon: "banknote.fill",
          initialBalanceMinor: 0,
          excludeFromTotal: false,
          sortOrder: 0,
          lifecycle: "active",
          lifecycleChangedAt: null,
          visibility: "public",
          ownerUserId: "user-1",
          version: 1,
          createdBy: "user-1",
          updatedBy: "user-1",
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
      categories: [],
      transactions: [
        {
          householdId: "household-1",
          id: "kept",
          type: "expense",
          amountMinor: 10,
          currency: "USD",
          originalAmountMinor: null,
          originalCurrency: null,
          exchangeRate: null,
          date: "2026-01-02",
          accountId: "cash",
          toAccountId: null,
          categoryId: null,
          isRecurring: false,
          recurringRuleId: null,
          description: "Kept",
          version: 1,
          createdBy: "user-1",
          updatedBy: "user-1",
          createdAt: timestamp,
          updatedAt: timestamp,
        },
        {
          householdId: "household-1",
          id: "private-tx",
          type: "expense",
          amountMinor: 20,
          currency: "USD",
          originalAmountMinor: null,
          originalCurrency: null,
          exchangeRate: null,
          date: "2026-01-02",
          accountId: "hidden",
          toAccountId: null,
          categoryId: null,
          isRecurring: false,
          recurringRuleId: null,
          description: "Hidden",
          version: 1,
          createdBy: "user-1",
          updatedBy: "user-1",
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
    });

    await expect(readSyncedTransactionSnapshot(db, "household-1", "user-1")).resolves.toMatchObject(
      {
        transactions: [{ id: "kept" }],
      },
    );
  });

  it("rejects corrupt cached data instead of exposing another ledger", async () => {
    const { db } = await setup();
    await db.insert(schema.appSettings).values({
      key: "ledger.syncedTransactionSnapshot.household-1.user-1",
      value: "not-json",
    });

    await expect(readSyncedTransactionSnapshot(db, "household-1", "user-1")).rejects.toThrow(
      "corrupt",
    );
  });
});

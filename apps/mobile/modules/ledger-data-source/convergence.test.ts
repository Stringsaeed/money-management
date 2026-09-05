import { drizzle } from "drizzle-orm/expo-sqlite";

import * as schema from "@/db/schema";
import { createTestSQLiteDatabase, type TestSQLiteDatabase } from "@/tests/test-utils/sqlite";

import {
  readSyncedTransactionSnapshot,
  writeSyncedTransactionSnapshot,
  type SyncedTransactionSnapshot,
} from "./synced-transaction-snapshot";

const databases: TestSQLiteDatabase[] = [];

const serverCreatedSnapshot = (): SyncedTransactionSnapshot => ({
  householdId: "household-1",
  userId: "user-1",
  accounts: [
    {
      householdId: "household-1",
      id: "account-server",
      name: "Server checking",
      type: "bank",
      currency: "AED",
      color: "#8B9D83",
      icon: "banknote.fill",
      initialBalanceMinor: 100_00,
      excludeFromTotal: false,
      sortOrder: 0,
      lifecycle: "active",
      lifecycleChangedAt: null,
      visibility: "public",
      ownerUserId: "user-1",
      version: 1,
      createdBy: "user-1",
      updatedBy: "user-1",
      createdAt: "2026-03-28T10:00:00.000Z",
      updatedAt: "2026-03-28T10:00:00.000Z",
    },
  ],
  categories: [
    {
      householdId: "household-1",
      id: "category-server",
      name: "Groceries",
      type: "expense",
      color: "#B48A7B",
      icon: "🛒",
      parentId: null,
      sortOrder: 0,
      lifecycle: "active",
      lifecycleChangedAt: null,
      version: 1,
      createdBy: "user-1",
      updatedBy: "user-1",
      createdAt: "2026-03-28T10:00:00.000Z",
      updatedAt: "2026-03-28T10:00:00.000Z",
    },
  ],
  transactions: [
    {
      householdId: "household-1",
      id: "transaction-server",
      type: "expense",
      amountMinor: 40_00,
      currency: "AED",
      originalAmountMinor: null,
      originalCurrency: null,
      exchangeRate: null,
      date: "2026-03-28",
      accountId: "account-server",
      toAccountId: null,
      categoryId: "category-server",
      isRecurring: false,
      recurringRuleId: null,
      description: "Server-created coffee",
      version: 1,
      createdBy: "user-1",
      updatedBy: "user-1",
      createdAt: "2026-03-28T10:00:00.000Z",
      updatedAt: "2026-03-28T10:00:00.000Z",
    },
  ],
});

afterEach(() => {
  databases.splice(0).forEach(({ close }) => close());
});

describe("synced ledger convergence", () => {
  it("makes poll-persisted server rows visible after a new drizzle handle restart", async () => {
    const testDatabase = createTestSQLiteDatabase();
    databases.push(testDatabase);
    await testDatabase.database.execAsync(
      "CREATE TABLE app_settings (key text PRIMARY KEY NOT NULL, value text NOT NULL)",
    );
    const writer = drizzle(testDatabase.database, { schema });
    const snapshot = serverCreatedSnapshot();

    await writeSyncedTransactionSnapshot(writer, snapshot);
    const restarted = drizzle(testDatabase.database, { schema });
    const reread = await readSyncedTransactionSnapshot(restarted, "household-1", "user-1");

    expect(reread.accounts.map((row) => row.id)).toEqual(["account-server"]);
    expect(reread.categories.map((row) => row.id)).toEqual(["category-server"]);
    expect(reread.transactions.map((row) => row.id)).toEqual(["transaction-server"]);
  });

  it("reaches the same snapshot whether push notices arrive or only the final poll writes", async () => {
    const pushThenPoll = createTestSQLiteDatabase();
    const pollOnly = createTestSQLiteDatabase();
    databases.push(pushThenPoll, pollOnly);
    await Promise.all(
      [pushThenPoll, pollOnly].map((testDatabase) =>
        testDatabase.database.execAsync(
          "CREATE TABLE app_settings (key text PRIMARY KEY NOT NULL, value text NOT NULL)",
        ),
      ),
    );

    const incremental = serverCreatedSnapshot();
    const finalSnapshot: SyncedTransactionSnapshot = {
      ...incremental,
      transactions: [
        ...incremental.transactions,
        {
          ...incremental.transactions[0],
          id: "transaction-later",
          description: "Later poll row",
        },
      ],
    };

    const pushDb = drizzle(pushThenPoll.database, { schema });
    await writeSyncedTransactionSnapshot(pushDb, incremental);
    await writeSyncedTransactionSnapshot(pushDb, finalSnapshot);

    const pollDb = drizzle(pollOnly.database, { schema });
    await writeSyncedTransactionSnapshot(pollDb, finalSnapshot);

    await expect(readSyncedTransactionSnapshot(pushDb, "household-1", "user-1")).resolves.toEqual(
      await readSyncedTransactionSnapshot(pollDb, "household-1", "user-1"),
    );
  });
});

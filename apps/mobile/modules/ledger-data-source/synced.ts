import type { CommandEnvelope } from "@trove/protocol";

import { orpc } from "@/lib/server/orpc";
import { generateId } from "@/utils/id";
import type { Account } from "@/types";
import { enqueueCommand, listProjectableCommands, type LocalDb } from "@/lib/sync/outbox";

import {
  createLedgerOperationRunner,
  LedgerDataSourceError,
  type LedgerAccountDataSource,
  type LedgerCategoryDataSource,
  type LedgerTransactionDataSource,
  type LedgerOfflineState,
  type LedgerDataSourceOperation,
} from "./contract";
import {
  assertSupportedAccountUpdate,
  calculateSyncedBalance,
  mapSyncedAccount,
  mapSyncedCategory,
  toSyncedAccountType,
  type SyncedAccount,
  type SyncedCategory,
  type SyncedTransaction,
} from "./synced-mappers";
import { projectPendingTransactions } from "./pending-transaction-projector";
import {
  readSyncedTransactionSnapshot,
  writeSyncedTransactionSnapshot,
  type SyncedTransactionSnapshot,
} from "./synced-transaction-snapshot";
import { createSyncedTransactionResource } from "./synced-transactions";

export type SyncedLedgerDataSource = LedgerAccountDataSource &
  LedgerCategoryDataSource &
  LedgerTransactionDataSource;

interface CreateSyncedLedgerDataSourceOptions {
  householdId: string;
  userId: string;
  db: LocalDb;
  offlineState?: Exclude<LedgerOfflineState, { kind: "offline_ready" }>;
}

export const createSyncedLedgerDataSource = ({
  householdId,
  userId,
  db,
  offlineState = { kind: "online" },
}: CreateSyncedLedgerDataSourceOptions): SyncedLedgerDataSource => {
  const runner = createLedgerOperationRunner("synced");
  const runNetwork = <TResult>(
    operation: LedgerDataSourceOperation,
    execute: () => Promise<TResult>,
  ) =>
    runner.run(operation, async () => {
      if (offlineState.kind === "offline_cached") {
        throw new LedgerDataSourceError(
          "synced",
          operation,
          new Error("This device is offline."),
          "offline",
        );
      }
      return execute();
    });
  const listRawAccounts = () =>
    runNetwork("read.accounts", () => orpc.ledger.accounts.list({ householdId }));
  const listRawTransactions = (
    options: { limit?: number; beforeDate?: string; beforeId?: string } = {},
  ) =>
    runNetwork("read.transactions", () =>
      orpc.ledger.transactions.list({
        householdId,
        ...(options.limit !== undefined && { limit: options.limit }),
        ...(options.beforeDate !== undefined && { beforeDate: options.beforeDate }),
        ...(options.beforeId !== undefined && { beforeId: options.beforeId }),
      }),
    );
  const listAllRawTransactions = async () => {
    const transactions: SyncedTransaction[] = [];
    let cursor: { date: string; id: string } | undefined;
    for (;;) {
      const page = await listRawTransactions({
        limit: 200,
        beforeDate: cursor?.date,
        beforeId: cursor?.id,
      });
      transactions.push(...page.transactions);
      if (!page.hasMore) {
        return transactions;
      }
      if (
        !page.nextCursor ||
        (page.nextCursor.date === cursor?.date && page.nextCursor.id === cursor?.id)
      ) {
        throw new Error("The synced Transaction cursor did not advance. Retry the ledger refresh.");
      }
      cursor = page.nextCursor;
    }
  };
  const listRawCategories = () =>
    runNetwork("read.categories", () => orpc.ledger.categories.list({ householdId }));
  const readOfflineSnapshot = async (
    operation: LedgerDataSourceOperation,
  ): Promise<SyncedTransactionSnapshot> => {
    try {
      return await readSyncedTransactionSnapshot(db, householdId, userId);
    } catch (cause) {
      throw new LedgerDataSourceError("synced", operation, cause, "offline");
    }
  };
  const refreshSnapshot = async (): Promise<SyncedTransactionSnapshot> => {
    const [accounts, categories, transactions] = await Promise.all([
      listRawAccounts(),
      listRawCategories(),
      listAllRawTransactions(),
    ]);
    const snapshot = { householdId, userId, accounts, categories, transactions };
    await writeSyncedTransactionSnapshot(db, snapshot);
    return snapshot;
  };
  const readCachedProjectedSnapshot = async (
    operation: LedgerDataSourceOperation = "read.transactions",
  ): Promise<SyncedTransactionSnapshot> => {
    const [snapshot, commands] = await Promise.all([
      readOfflineSnapshot(operation),
      listProjectableCommands(db, householdId, userId),
    ]);
    return projectPendingTransactions(snapshot, commands);
  };
  const readProjectedSnapshot = (operation: LedgerDataSourceOperation = "read.transactions") =>
    runner.run(operation, async () => {
      if (offlineState.kind === "offline_cached") {
        return readCachedProjectedSnapshot(operation);
      }
      let snapshot: SyncedTransactionSnapshot;
      try {
        snapshot = await refreshSnapshot();
      } catch (cause) {
        try {
          snapshot = await readSyncedTransactionSnapshot(db, householdId, userId);
        } catch {
          throw cause;
        }
      }
      const commands = await listProjectableCommands(db, householdId, userId);
      return projectPendingTransactions(snapshot, commands);
    });
  const enqueueTransactionIntent = (
    operation: LedgerDataSourceOperation,
    command: CommandEnvelope,
  ) =>
    runner.run(operation, async () => {
      if (command.householdId !== householdId) {
        throw new Error("The command belongs to a different household.");
      }
      await enqueueCommand(db, { ...command, userId });
    });
  const listProjectedAccounts = async (includeArchived: boolean): Promise<Account[]> => {
    const snapshot = await readProjectedSnapshot("read.accounts");
    return snapshot.accounts
      .filter((row) => includeArchived || row.lifecycle === "active")
      .map(mapSyncedAccount);
  };
  const findCachedAccount = async (id: string): Promise<SyncedAccount> => {
    const account = (await readCachedProjectedSnapshot("read.accounts")).accounts.find(
      (row) => row.id === id,
    );
    if (!account) {
      throw new Error(
        "This Account is not in the authorized ledger snapshot. Refresh the ledger before editing it.",
      );
    }
    return account;
  };
  const listProjectedCategories = async (type?: "income" | "expense", includeArchived = false) => {
    const snapshot = await readProjectedSnapshot("read.categories");
    return snapshot.categories
      .filter(
        (row) =>
          (includeArchived || row.lifecycle === "active") &&
          (type === undefined || row.type === type),
      )
      .map(mapSyncedCategory);
  };
  const findCachedCategory = async (id: string): Promise<SyncedCategory> => {
    const category = (await readCachedProjectedSnapshot("read.categories")).categories.find(
      (row) => row.id === id,
    );
    if (!category) {
      throw new Error(
        "This Category is not in the authorized ledger snapshot. Refresh the ledger before editing it.",
      );
    }
    return category;
  };
  const transactions = createSyncedTransactionResource({
    householdId,
    readSnapshot: () => readProjectedSnapshot(),
    readCachedSnapshot: () => readCachedProjectedSnapshot(),
    executeCommand: enqueueTransactionIntent,
  });

  return {
    source: "synced",
    cacheKey: `synced:${householdId}:${userId}`,
    offlineState,
    accounts: {
      list: () => listProjectedAccounts(false),
      get: async (id) => (await listProjectedAccounts(true)).find((account) => account.id === id),
      listWithBalances: async (includeArchived) => {
        const snapshot = await readProjectedSnapshot("read.accounts");
        return snapshot.accounts
          .map(mapSyncedAccount)
          .filter((account) => includeArchived || account.lifecycle === "active")
          .map((account) => ({
            ...account,
            balance: calculateSyncedBalance(account, snapshot.transactions),
          }));
      },
      create: async (data) => {
        const id = generateId();
        await enqueueTransactionIntent("mutation.account-create", {
          commandId: generateId(),
          householdId,
          kind: "account.create",
          payload: {
            id,
            name: data.name,
            type: toSyncedAccountType(data.type),
            currency: data.currency,
            color: data.color,
            icon: data.icon,
            initialBalanceMinor: data.initialBalance,
            excludeFromTotal: data.excludeFromTotal,
            sortOrder: data.sortOrder,
          },
        });
        return id;
      },
      update: async (id, data) => {
        assertSupportedAccountUpdate(data);
        const expectedVersion = (await findCachedAccount(id)).version;
        return enqueueTransactionIntent("mutation.account-update", {
          commandId: generateId(),
          householdId,
          kind: "account.update",
          payload: {
            accountId: id,
            ...(data.name !== undefined && { name: data.name }),
            ...(data.color !== undefined && { color: data.color }),
            ...(data.icon !== undefined && { icon: data.icon }),
            ...(data.excludeFromTotal !== undefined && {
              excludeFromTotal: data.excludeFromTotal,
            }),
            ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
            ...(data.visibility !== undefined && { visibility: data.visibility }),
          },
          preconditions: [{ entityId: id, expectedVersion }],
        });
      },
      archive: async (id) => {
        const account = await findCachedAccount(id);
        if (account.lifecycle === "archived") {
          return;
        }
        return enqueueTransactionIntent("mutation.account-archive", {
          commandId: generateId(),
          householdId,
          kind: "account.archive",
          payload: { accountId: id },
          preconditions: [{ entityId: id, expectedVersion: account.version }],
        });
      },
    },
    accountLifecycle: { kind: "synced" },
    categories: {
      list: (type, includeArchived = false) => listProjectedCategories(type, includeArchived),
      get: async (id) =>
        (await listProjectedCategories(undefined, true)).find((category) => category.id === id),
      create: async (data) => {
        const id = generateId();
        await enqueueTransactionIntent("mutation.category-create", {
          commandId: generateId(),
          householdId,
          kind: "category.create",
          payload: {
            id,
            name: data.name,
            type: data.type,
            color: data.color,
            icon: data.icon,
            parentId: data.parentId ?? null,
            sortOrder: data.sortOrder,
          },
        });
        return id;
      },
      update: async (id, data) => {
        const expectedVersion = (await findCachedCategory(id)).version;
        return enqueueTransactionIntent("mutation.category-update", {
          commandId: generateId(),
          householdId,
          kind: "category.update",
          payload: {
            categoryId: id,
            ...(data.name !== undefined && { name: data.name }),
            ...(data.color !== undefined && { color: data.color }),
            ...(data.icon !== undefined && { icon: data.icon }),
            ...(data.parentId !== undefined && { parentId: data.parentId }),
            ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
          },
          preconditions: [{ entityId: id, expectedVersion }],
        });
      },
      archive: async (id) => {
        const category = await findCachedCategory(id);
        if (category.lifecycle === "archived") {
          return;
        }
        return enqueueTransactionIntent("mutation.category-archive", {
          commandId: generateId(),
          householdId,
          kind: "category.archive",
          payload: { categoryId: id },
          preconditions: [{ entityId: id, expectedVersion: category.version }],
        });
      },
    },
    categoryLifecycle: { kind: "synced" },
    transactions,
    observeErrors: runner.observeErrors,
  };
};

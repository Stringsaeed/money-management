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
  type LedgerHydration,
  type LedgerOfflineState,
  type LedgerDataSourceOperation,
  type LedgerWriteback,
} from "./contract";
import {
  assertSupportedAccountUpdate,
  calculateSyncedBalance,
  mapSyncedAccount,
  mapSyncedCategory,
  toSyncedAccountType,
  type SyncedTransaction,
} from "./synced-mappers";
import { projectPendingTransactions } from "./pending-transaction-projector";
import {
  readSyncedTransactionSnapshot,
  writeSyncedTransactionSnapshot,
  type SyncedTransactionSnapshot,
} from "./synced-transaction-snapshot";
import { createSyncedTransactionResource } from "./synced-transactions";

type SyncedHydration = Awaited<ReturnType<typeof orpc.sync.getDelta>>;
type SyncedWriteback = Awaited<ReturnType<typeof orpc.commands.apply>>;

export type SyncedLedgerDataSource = LedgerAccountDataSource &
  LedgerCategoryDataSource &
  LedgerTransactionDataSource & {
    hydration: LedgerHydration<{ since: number }, SyncedHydration>;
    writeback: LedgerWriteback<CommandEnvelope, SyncedWriteback>;
  };

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
  const apply = async (command: CommandEnvelope) => {
    if (command.householdId !== householdId) {
      throw new Error("The command belongs to a different household.");
    }
    return orpc.commands.apply({
      ...command,
      preconditions: command.preconditions?.map((precondition) => ({ ...precondition })),
    });
  };
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
  const listAccounts = async (includeArchived: boolean): Promise<Account[]> => {
    const rows =
      offlineState.kind === "offline_cached"
        ? (await readOfflineSnapshot("read.accounts")).accounts
        : await listRawAccounts();
    return rows
      .filter((row) => includeArchived || row.lifecycle === "active")
      .map(mapSyncedAccount);
  };
  const executeServerCommand = async (
    operation: LedgerDataSourceOperation,
    command: CommandEnvelope,
  ) =>
    runNetwork(operation, async () => {
      const result = await apply(command);
      if (result.kind !== "applied") {
        throw new Error(`The server rejected the command: ${result.kind}.`);
      }
      return result;
    });
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
  const readProjectedSnapshot = () =>
    runner.run("read.transactions", async () => {
      if (offlineState.kind === "offline_cached") {
        return readCachedProjectedSnapshot();
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
  const transactions = createSyncedTransactionResource({
    householdId,
    readSnapshot: readProjectedSnapshot,
    readCachedSnapshot: readCachedProjectedSnapshot,
    executeCommand: enqueueTransactionIntent,
  });

  return {
    source: "synced",
    cacheKey: `synced:${householdId}:${userId}`,
    offlineState,
    accounts: {
      list: () => listAccounts(false),
      get: async (id) => (await listAccounts(true)).find((account) => account.id === id),
      listWithBalances: async (includeArchived) => {
        const snapshot = await readProjectedSnapshot();
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
        await executeServerCommand("mutation.account-create", {
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
        return executeServerCommand("mutation.account-update", {
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
          },
        });
      },
      archive: (id) =>
        executeServerCommand("mutation.account-archive", {
          commandId: generateId(),
          householdId,
          kind: "account.archive",
          payload: { accountId: id },
        }),
    },
    accountLifecycle: { kind: "synced" },
    categories: {
      list: async (type, includeArchived = false) => {
        const rows =
          offlineState.kind === "offline_cached"
            ? (await readOfflineSnapshot("read.categories")).categories
            : await listRawCategories();
        return rows
          .filter(
            (row) =>
              (includeArchived || row.lifecycle === "active") &&
              (type === undefined || row.type === type),
          )
          .map(mapSyncedCategory);
      },
      get: async (id) => {
        const rows =
          offlineState.kind === "offline_cached"
            ? (await readOfflineSnapshot("read.categories")).categories
            : await listRawCategories();
        return rows.map(mapSyncedCategory).find((category) => category.id === id);
      },
      create: async (data) => {
        const id = generateId();
        await executeServerCommand("mutation.category-create", {
          commandId: generateId(),
          householdId,
          kind: "category.create",
          payload: { id, ...data },
        });
        return id;
      },
      update: (id, data) =>
        executeServerCommand("mutation.category-update", {
          commandId: generateId(),
          householdId,
          kind: "category.update",
          payload: { categoryId: id, ...data },
        }),
      archive: (id) =>
        executeServerCommand("mutation.category-archive", {
          commandId: generateId(),
          householdId,
          kind: "category.archive",
          payload: { categoryId: id },
        }),
    },
    categoryLifecycle: { kind: "synced" },
    transactions,
    hydration: {
      pull: ({ since }) =>
        runNetwork("hydration.pull", () => orpc.sync.getDelta({ householdId, since })),
    },
    writeback: {
      submit: (command) => runNetwork("writeback.submit", () => apply(command)),
    },
    observeErrors: runner.observeErrors,
  };
};

import type { CommandEnvelope } from "@trove/protocol";

import { orpc } from "@/lib/server/orpc";
import { generateId } from "@/utils/id";
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
import { mapSyncedCategory, type SyncedTransaction } from "./synced-mappers";
import { projectPendingLedger } from "./pending-transaction-projector";
import { createSyncedAccountResource } from "./synced-accounts";
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

const snapshotRefreshByCacheKey = new Map<string, Promise<SyncedTransactionSnapshot>>();

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
      if (offlineState.kind === "offline_cached") {
        return { householdId, userId, accounts: [], categories: [], transactions: [] };
      }
      throw new LedgerDataSourceError("synced", operation, cause, "offline");
    }
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
  const refreshSnapshotCoalesced = (): Promise<SyncedTransactionSnapshot> => {
    const cacheKey = `synced:${householdId}:${userId}`;
    const inflight = snapshotRefreshByCacheKey.get(cacheKey);
    if (inflight) return inflight;
    const pending = refreshSnapshot().finally(() => {
      snapshotRefreshByCacheKey.delete(cacheKey);
    });
    snapshotRefreshByCacheKey.set(cacheKey, pending);
    return pending;
  };
  const readCachedProjectedSnapshot = async (
    operation: LedgerDataSourceOperation = "read.transactions",
  ): Promise<SyncedTransactionSnapshot> => {
    const [snapshot, commands] = await Promise.all([
      readOfflineSnapshot(operation),
      listProjectableCommands(db, householdId, userId),
    ]);
    return projectPendingLedger(snapshot, commands);
  };
  const readProjectedSnapshot = (operation: LedgerDataSourceOperation = "read.transactions") =>
    runner.run(operation, async () => {
      if (offlineState.kind === "offline_cached") {
        return readCachedProjectedSnapshot(operation);
      }
      let snapshot: SyncedTransactionSnapshot;
      try {
        snapshot = await refreshSnapshotCoalesced();
      } catch (cause) {
        try {
          snapshot = await readSyncedTransactionSnapshot(db, householdId, userId);
        } catch {
          throw cause;
        }
      }
      const commands = await listProjectableCommands(db, householdId, userId);
      return projectPendingLedger(snapshot, commands);
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
  const { accounts, accountPrivacy } = createSyncedAccountResource({
    householdId,
    userId,
    readSnapshot: readProjectedSnapshot,
    readCachedSnapshot: readCachedProjectedSnapshot,
    enqueue: enqueueTransactionIntent,
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
    accounts,
    accountLifecycle: { kind: "synced" },
    accountPrivacy,
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

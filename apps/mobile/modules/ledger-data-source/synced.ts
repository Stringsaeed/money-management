import type { CommandEnvelope } from "@trove/protocol";

import { orpc } from "@/lib/server/orpc";
import { generateId } from "@/utils/id";
import type { Account } from "@/types";

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
  offlineState?: Exclude<LedgerOfflineState, { kind: "offline_ready" }>;
}

export const createSyncedLedgerDataSource = ({
  householdId,
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
  const listRawTransactions = (options: { limit?: number; beforeDate?: string } = {}) =>
    runNetwork("read.transactions", () =>
      orpc.ledger.transactions.list({
        householdId,
        ...(options.limit !== undefined && { limit: options.limit }),
        ...(options.beforeDate !== undefined && { beforeDate: options.beforeDate }),
      }),
    );
  const listAllRawTransactions = async () => {
    const transactions: SyncedTransaction[] = [];
    let beforeDate: string | undefined;
    for (;;) {
      const page = await listRawTransactions({ limit: 200, beforeDate });
      transactions.push(...page.transactions);
      if (!page.hasMore) {
        return { transactions, hasMore: false };
      }
      const nextBeforeDate = page.transactions.at(-1)?.date;
      if (!nextBeforeDate || nextBeforeDate === beforeDate) {
        throw new Error("The synced Transaction cursor did not advance. Retry the ledger refresh.");
      }
      beforeDate = nextBeforeDate;
    }
  };
  const listRawCategories = () =>
    runNetwork("read.categories", () => orpc.ledger.categories.list({ householdId }));
  const listAccounts = async (includeArchived: boolean): Promise<Account[]> => {
    const rows = await listRawAccounts();
    return rows
      .filter((row) => includeArchived || row.lifecycle === "active")
      .map(mapSyncedAccount);
  };
  const executeCommand = async (operation: LedgerDataSourceOperation, command: CommandEnvelope) =>
    runNetwork(operation, async () => {
      const result = await apply(command);
      if (result.kind !== "applied") {
        throw new Error(`The server rejected the command: ${result.kind}.`);
      }
      return result;
    });
  const transactions = createSyncedTransactionResource({
    householdId,
    listAccounts: listRawAccounts,
    listCategories: listRawCategories,
    listAllTransactions: listAllRawTransactions,
    listTransactionPage: listRawTransactions,
    executeCommand,
  });

  return {
    source: "synced",
    cacheKey: `synced:${householdId}`,
    offlineState,
    accounts: {
      list: () => listAccounts(false),
      get: async (id) => (await listAccounts(true)).find((account) => account.id === id),
      listWithBalances: async (includeArchived) => {
        const [accounts, page] = await Promise.all([
          listAccounts(includeArchived),
          listAllRawTransactions(),
        ]);
        return accounts.map((account) => ({
          ...account,
          balance: calculateSyncedBalance(account, page.transactions),
        }));
      },
      create: async (data) => {
        const id = generateId();
        await executeCommand("mutation.account-create", {
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
        return executeCommand("mutation.account-update", {
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
        executeCommand("mutation.account-archive", {
          commandId: generateId(),
          householdId,
          kind: "account.archive",
          payload: { accountId: id },
        }),
    },
    accountLifecycle: { kind: "synced" },
    categories: {
      list: async (type, includeArchived = false) => {
        const rows = await listRawCategories();
        return rows
          .filter(
            (row) =>
              (includeArchived || row.lifecycle === "active") &&
              (type === undefined || row.type === type),
          )
          .map(mapSyncedCategory);
      },
      get: async (id) =>
        (await listRawCategories()).map(mapSyncedCategory).find((category) => category.id === id),
      create: async (data) => {
        const id = generateId();
        await executeCommand("mutation.category-create", {
          commandId: generateId(),
          householdId,
          kind: "category.create",
          payload: { id, ...data },
        });
        return id;
      },
      update: (id, data) =>
        executeCommand("mutation.category-update", {
          commandId: generateId(),
          householdId,
          kind: "category.update",
          payload: { categoryId: id, ...data },
        }),
      archive: (id) =>
        executeCommand("mutation.category-archive", {
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

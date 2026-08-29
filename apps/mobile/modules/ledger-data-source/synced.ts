import type { CommandEnvelope } from "@trove/protocol";

import { orpc } from "@/lib/server/orpc";

import {
  createLedgerOperationRunner,
  type LedgerDataSource,
  type LedgerOfflineState,
} from "./contract";

type SyncedAccount = Awaited<ReturnType<typeof orpc.ledger.accounts.list>>[number];
type SyncedCategory = Awaited<ReturnType<typeof orpc.ledger.categories.list>>[number];
type SyncedTransactionPage = Awaited<ReturnType<typeof orpc.ledger.transactions.list>>;
type SyncedHydration = Awaited<ReturnType<typeof orpc.sync.getDelta>>;
type SyncedWriteback = Awaited<ReturnType<typeof orpc.commands.apply>>;

export interface SyncedLedgerReads {
  accounts: { list: () => Promise<readonly SyncedAccount[]> };
  categories: { list: () => Promise<readonly SyncedCategory[]> };
  transactions: {
    list: (options?: { limit?: number; beforeDate?: string }) => Promise<SyncedTransactionPage>;
  };
}

export interface SyncedLedgerMutations {
  execute: (command: CommandEnvelope) => Promise<SyncedWriteback>;
}

export type SyncedLedgerDataSource = LedgerDataSource<
  SyncedLedgerReads,
  SyncedLedgerMutations,
  { since: number },
  SyncedHydration,
  CommandEnvelope,
  SyncedWriteback
>;

interface CreateSyncedLedgerDataSourceOptions {
  householdId: string;
  offlineState?: Exclude<LedgerOfflineState, { kind: "offline_ready" }>;
}

export const createSyncedLedgerDataSource = ({
  householdId,
  offlineState = { kind: "online" },
}: CreateSyncedLedgerDataSourceOptions): SyncedLedgerDataSource => {
  const runner = createLedgerOperationRunner("synced");
  const apply = async (command: CommandEnvelope) => {
    if (command.householdId !== householdId) {
      throw new Error("The command belongs to a different household.");
    }
    return orpc.commands.apply({
      ...command,
      preconditions: command.preconditions?.map((precondition) => ({ ...precondition })),
    });
  };

  return {
    source: "synced",
    cacheKey: `synced:${householdId}`,
    offlineState,
    reads: {
      accounts: {
        list: () => runner.run("read.accounts", () => orpc.ledger.accounts.list({ householdId })),
      },
      categories: {
        list: () =>
          runner.run("read.categories", () => orpc.ledger.categories.list({ householdId })),
      },
      transactions: {
        list: (options = {}) =>
          runner.run("read.transactions", () =>
            orpc.ledger.transactions.list({
              householdId,
              ...(options.limit !== undefined && { limit: options.limit }),
              ...(options.beforeDate !== undefined && { beforeDate: options.beforeDate }),
            }),
          ),
      },
    },
    mutations: {
      execute: (command) => runner.run("mutation.execute", () => apply(command)),
    },
    hydration: {
      pull: ({ since }) =>
        runner.run("hydration.pull", () => orpc.sync.getDelta({ householdId, since })),
    },
    writeback: {
      submit: (command) => runner.run("writeback.submit", () => apply(command)),
    },
    observeErrors: runner.observeErrors,
  };
};

export type { SyncedAccount, SyncedCategory, SyncedTransactionPage };

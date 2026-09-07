import {
  mapPowerSyncAccount,
  mapPowerSyncCategory,
  mapPowerSyncTransaction,
  mapSyncedTransaction,
} from "@/modules/ledger-data-source/synced-mappers";
import { commandMetadataFor } from "@/modules/powersync/command-metadata";

import type { PowerSyncLedgerCollections } from "./collections";
import {
  mintPowerSyncCreate,
  mintPowerSyncEdit,
  mintPowerSyncRefund,
  mintPowerSyncRemove,
  type PowerSyncMintContext,
} from "./intents";
import type {
  LedgerStatus,
  LedgerTransaction,
  NewTransactionInput,
  RefundInput,
  TransactionEdit,
} from "./types";

export interface LedgerDependencies {
  readonly householdId: string;
  readonly userId: string;
  readonly dbIdentity: object;
  readonly collections: PowerSyncLedgerCollections;
  readonly newId: () => string;
  readonly now: () => string;
  readonly offline?: boolean;
}

export interface TransactionIntents {
  readonly create: (input: NewTransactionInput) => Promise<string>;
  readonly edit: (id: string, changes: TransactionEdit) => Promise<void>;
  readonly remove: (id: string) => Promise<void>;
  readonly linkRefund: (input: RefundInput) => Promise<string>;
}

export interface SyncedTransactionLedger {
  readonly householdId: string;
  readonly userId: string;
  readonly collections: PowerSyncLedgerCollections;
  readonly intents: TransactionIntents;
  readonly status: () => LedgerStatus;
  readonly rows: () => readonly LedgerTransaction[];
  readonly revision: () => number;
  readonly subscribe: (listener: () => void) => () => void;
  readonly refresh: () => Promise<void>;
  readonly setOffline: (offline: boolean) => void;
  readonly dispose: () => void;
}

const missingRow = (): Error =>
  new Error(
    "This Transaction is not in the authorized PowerSync collection. Wait for sync before editing it.",
  );

export const createSyncedTransactionLedger = (
  dependencies: LedgerDependencies,
): SyncedTransactionLedger => {
  const { collections, householdId, userId } = dependencies;
  let offline = dependencies.offline ?? false;
  let revision = 0;
  let disposed = false;
  const listeners = new Set<() => void>();

  const emit = (): void => {
    revision += 1;
    for (const listener of [...listeners]) listener();
  };

  const changeSubscriptions = [
    collections.accounts.subscribeChanges(emit),
    collections.categories.subscribeChanges(emit),
    collections.transactions.subscribeChanges(emit),
    collections.rejectedChanges.subscribeChanges(emit),
  ];
  const statusSubscriptions = [
    collections.accounts.on("status:change", emit),
    collections.categories.on("status:change", emit),
    collections.transactions.on("status:change", emit),
    collections.rejectedChanges.on("status:change", emit),
  ];

  const accountCurrency = (accountId: string): string => {
    const account = collections.accounts.get(accountId);
    if (!account || account.household_id !== householdId) {
      throw new Error("This Account is not in the authorized PowerSync collection.");
    }
    return account.currency;
  };
  const mintContext: PowerSyncMintContext = {
    householdId,
    userId,
    newId: dependencies.newId,
    now: dependencies.now,
    accountCurrency,
  };

  const rows = (): readonly LedgerTransaction[] => {
    const accounts = collections.accounts.toArray
      .filter((row) => row.household_id === householdId)
      .map(mapPowerSyncAccount);
    const categories = collections.categories.toArray
      .filter((row) => row.household_id === householdId)
      .map(mapPowerSyncCategory);
    return collections.transactions.toArray
      .filter((row) => row.household_id === householdId)
      .map((row) => ({
        ...mapSyncedTransaction(mapPowerSyncTransaction(row), accounts, categories),
        version: row.version,
        sync: row.$synced
          ? ({ kind: "confirmed" } as const)
          : ({ kind: "pending", commandIds: [] } as const),
      }));
  };

  const rowOf = (id: string): LedgerTransaction => {
    const row = rows().find((candidate) => candidate.id === id);
    if (!row) throw missingRow();
    return row;
  };

  const intents: TransactionIntents = {
    create: async (input) => {
      const minted = mintPowerSyncCreate(mintContext, input);
      await collections.transactions.insert(minted.row, {
        metadata: commandMetadataFor(minted.command),
      }).isPersisted.promise;
      return minted.receipt.id;
    },
    edit: async (id, changes) => {
      const minted = mintPowerSyncEdit(mintContext, rowOf(id), changes);
      await collections.transactions.update(
        id,
        { metadata: commandMetadataFor(minted.command) },
        (draft) => Object.assign(draft, minted.changes),
      ).isPersisted.promise;
    },
    remove: async (id) => {
      const minted = mintPowerSyncRemove(mintContext, rowOf(id));
      await collections.transactions.delete(minted.id, {
        metadata: commandMetadataFor(minted.command),
      }).isPersisted.promise;
    },
    linkRefund: async (input) => {
      const original = collections.transactions.get(input.originalTransactionId);
      if (!original || original.household_id !== householdId) throw missingRow();
      const minted = mintPowerSyncRefund(mintContext, input, original);
      await collections.transactions.insert(minted.row, {
        metadata: commandMetadataFor(minted.command),
      }).isPersisted.promise;
      return minted.receipt.id;
    },
  };

  return {
    householdId,
    userId,
    collections,
    intents,
    rows,
    status: () => {
      const statuses = [
        collections.accounts.status,
        collections.categories.status,
        collections.transactions.status,
        collections.rejectedChanges.status,
      ];
      if (statuses.includes("error")) {
        return {
          phase: "unavailable",
          message:
            "PowerSync could not load the authorized ledger. Check the connection and retry.",
        };
      }
      if (!statuses.every((status) => status === "ready")) return { phase: "hydrating" };
      const queuedCommands =
        collections.accounts.toArray.filter((row) => !row.$synced).length +
        collections.categories.toArray.filter((row) => !row.$synced).length +
        collections.transactions.toArray.filter((row) => !row.$synced).length;
      return {
        phase: "ready",
        queuedCommands,
        ...(offline && { stale: "offline" as const }),
      };
    },
    revision: () => revision,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    refresh: async () => {
      await Promise.all([
        collections.accounts.preload(),
        collections.categories.preload(),
        collections.transactions.preload(),
        collections.rejectedChanges.preload(),
      ]);
    },
    setOffline: (nextOffline) => {
      if (offline === nextOffline) return;
      offline = nextOffline;
      emit();
    },
    dispose: () => {
      if (disposed) return;
      disposed = true;
      for (const subscription of changeSubscriptions) subscription.unsubscribe();
      for (const unsubscribe of statusSubscriptions) unsubscribe();
      listeners.clear();
      void Promise.all([
        collections.accounts.cleanup(),
        collections.categories.cleanup(),
        collections.transactions.cleanup(),
        collections.rejectedChanges.cleanup(),
      ]);
    },
  };
};

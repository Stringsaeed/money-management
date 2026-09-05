import { createCollection } from "@tanstack/db";
import type { CommandEnvelope, CommandResult } from "@trove/protocol";

import type { ProjectableCommand } from "@/lib/sync/outbox";
import type { SyncedTransactionSnapshot } from "@/modules/ledger-data-source/synced-transaction-snapshot";

import { parseAck, parseEffectTags, type RemoteChange } from "./ack";
import { mintCreate, mintEdit, mintRefund, mintRemove, type MintContext } from "./intents";
import {
  diffRows,
  initialState,
  materialize,
  reduce,
  statusOf,
  type LedgerEvent,
  type LedgerState,
} from "./store";
import {
  asSeq,
  type LedgerStatus,
  type LedgerTransaction,
  type NewTransactionInput,
  type RefundInput,
  type TransactionEdit,
} from "./types";

const createTransactionCollection = (
  id: string,
  sync: {
    sync: (params: {
      begin: SyncWriter["begin"];
      write: SyncWriter["write"];
      commit: SyncWriter["commit"];
      markReady: SyncWriter["markReady"];
      truncate: SyncWriter["truncate"];
    }) => () => void;
  },
) =>
  createCollection({
    id,
    getKey: (row: LedgerTransaction) => row.id,
    startSync: true,
    gcTime: Number.POSITIVE_INFINITY,
    sync,
  });

type TransactionCollection = ReturnType<typeof createTransactionCollection>;

type SyncWriter = {
  begin: () => void;
  write: (
    message:
      | { type: "insert" | "update"; value: LedgerTransaction }
      | { type: "delete"; key: string },
  ) => void;
  commit: () => void;
  markReady: () => void;
  truncate: () => void;
};

export interface LedgerDependencies {
  readonly householdId: string;
  readonly userId: string;
  readonly dbIdentity: object;
  readonly fetchAuthoritative: () => Promise<SyncedTransactionSnapshot>;
  readonly readCachedSnapshot: () => Promise<SyncedTransactionSnapshot>;
  readonly writeCachedSnapshot: (snapshot: SyncedTransactionSnapshot) => Promise<void>;
  readonly readWatermark: () => Promise<number>;
  readonly listQueuedCommands: () => Promise<readonly ProjectableCommand[]>;
  readonly enqueue: (command: CommandEnvelope) => Promise<void>;
  readonly observeOutbox: (
    listener: (change: { householdId: string; userId?: string }) => void,
  ) => () => void;
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
  readonly collection: TransactionCollection;
  readonly intents: TransactionIntents;
  readonly status: () => LedgerStatus;
  readonly rows: () => readonly LedgerTransaction[];
  readonly revision: () => number;
  readonly subscribe: (listener: () => void) => () => void;
  readonly settle: (envelope: CommandEnvelope, result: CommandResult) => void;
  readonly noteRemoteChanges: (changes: readonly RemoteChange[]) => void;
  readonly refresh: () => Promise<void>;
  readonly setOffline: (offline: boolean) => void;
  readonly dispose: () => void;
}

const missingRow = (): Error =>
  new Error(
    "This Transaction is not in the authorized ledger snapshot. Refresh the ledger before editing it.",
  );

export const createSyncedTransactionLedger = (
  deps: LedgerDependencies,
): SyncedTransactionLedger => {
  let state: LedgerState = initialState(deps.householdId, deps.userId);
  let published: readonly LedgerTransaction[] = [];
  let revision = 0;
  let disposed = false;
  let refreshInFlight: Promise<void> | null = null;
  let writer: SyncWriter | null = null;
  const listeners = new Set<() => void>();

  const emit = (): void => {
    revision += 1;
    for (const listener of [...listeners]) listener();
  };

  const replayPublished = (): void => {
    if (!writer) return;
    writer.begin();
    writer.truncate();
    for (const row of published) writer.write({ type: "insert", value: row });
    writer.commit();
  };

  const collection = createTransactionCollection(
    `ledger-transactions:${deps.householdId}:${deps.userId}`,
    {
      sync: (params) => {
        writer = {
          begin: params.begin,
          write: params.write,
          commit: params.commit,
          markReady: params.markReady,
          truncate: params.truncate,
        };
        replayPublished();
        params.markReady();
        return () => {
          writer = null;
        };
      },
    },
  );

  const publish = (): void => {
    const next = materialize(state);
    const diffs = diffRows(published, next);
    if (writer && diffs.length > 0) {
      writer.begin();
      for (const diff of diffs) {
        if (diff.op === "delete") writer.write({ type: "delete", key: diff.id });
        else writer.write({ type: diff.op, value: diff.row });
      }
      writer.commit();
    }
    published = next;
    emit();
  };

  const dispatch = (event: LedgerEvent): void => {
    const next = reduce(state, event);
    if (next === state) return;
    state = next;
    publish();
  };

  const pullPending = async (): Promise<void> => {
    const pending = await deps.listQueuedCommands();
    if (disposed) return;
    dispatch({ kind: "outbox_changed", pending });
  };

  const doRefresh = async (): Promise<void> => {
    dispatch({ kind: "hydrate_started" });
    try {
      const watermark = asSeq(await deps.readWatermark());
      const snapshot = await deps.fetchAuthoritative();
      await deps.writeCachedSnapshot(snapshot);
      if (disposed) return;
      dispatch({ kind: "hydrated", base: { snapshot, watermark } });
      await pullPending();
    } catch {
      try {
        const snapshot = await deps.readCachedSnapshot();
        const watermark = asSeq(await deps.readWatermark());
        if (disposed) return;
        dispatch({ kind: "hydrated", base: { snapshot, watermark } });
        dispatch({ kind: "hydrate_failed" });
        await pullPending();
      } catch {
        if (disposed) return;
        dispatch({ kind: "hydrate_failed" });
      }
    }
  };

  const refresh = (): Promise<void> => {
    if (refreshInFlight) return refreshInFlight;
    refreshInFlight = doRefresh().finally(() => {
      refreshInFlight = null;
    });
    return refreshInFlight;
  };

  const boot = async (): Promise<void> => {
    try {
      const snapshot = await deps.readCachedSnapshot();
      const watermark = asSeq(await deps.readWatermark());
      if (disposed) return;
      dispatch({ kind: "hydrated", base: { snapshot, watermark } });
      await pullPending();
    } catch {
      // First launch has no cached snapshot; refresh fills it.
    }
    if (deps.offline) {
      dispatch({ kind: "offline_changed", offline: true });
      return;
    }
    await refresh();
  };

  void boot();

  const unsubscribeOutbox = deps.observeOutbox((change) => {
    if (disposed) return;
    if (change.householdId !== deps.householdId) return;
    if (change.userId && change.userId !== deps.userId) return;
    void pullPending();
  });

  const mintCtx: MintContext = {
    householdId: deps.householdId,
    newId: deps.newId,
    now: deps.now,
  };

  const rowOf = (id: string): LedgerTransaction | undefined =>
    published.find((row) => row.id === id);

  const intents: TransactionIntents = {
    create: async (input) => {
      const minted = mintCreate(mintCtx, input);
      await deps.enqueue(minted.command);
      return minted.receipt.id;
    },
    edit: async (id, changes) => {
      const row = rowOf(id);
      if (!row) throw missingRow();
      await deps.enqueue(mintEdit(mintCtx, row, changes));
    },
    remove: async (id) => {
      const row = rowOf(id);
      if (!row) throw missingRow();
      await deps.enqueue(mintRemove(mintCtx, row));
    },
    linkRefund: async (input) => {
      const minted = mintRefund(mintCtx, input);
      await deps.enqueue(minted.command);
      return minted.receipt.id;
    },
  };

  return {
    householdId: deps.householdId,
    userId: deps.userId,
    collection,
    intents,
    status: () => statusOf(state),
    rows: () => published,
    revision: () => revision,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    settle: (envelope, result) => {
      const outcome = parseAck(envelope, result);
      if (outcome.kind === "confirmed") {
        dispatch({ kind: "command_confirmed", confirmed: outcome.confirmed });
        return;
      }
      if (outcome.kind === "mismatch") void refresh();
    },
    noteRemoteChanges: (changes) => {
      const ours = new Set([...state.confirmed.values()].map((entry) => entry.seq));
      const needsRefresh = changes.some((change) => {
        if (ours.has(asSeq(change.seq))) return false;
        return parseEffectTags(change.effects).some(
          (tag) => tag === "ledger" || tag === "balances" || tag === "summaries",
        );
      });
      if (needsRefresh) void refresh();
    },
    refresh,
    setOffline: (offline) => {
      dispatch({ kind: "offline_changed", offline });
    },
    dispose: () => {
      disposed = true;
      unsubscribeOutbox();
      listeners.clear();
    },
  };
};

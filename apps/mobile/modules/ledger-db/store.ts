import type { CommandEnvelope } from "@trove/protocol";

import type { ProjectableCommand } from "@/lib/sync/outbox";
import { projectPendingTransactions } from "@/modules/ledger-data-source/pending-transaction-projector";
import {
  mapSyncedAccount,
  mapSyncedCategory,
  mapSyncedTransaction,
} from "@/modules/ledger-data-source/synced-mappers";

import {
  asCommandId,
  asTransactionId,
  transactionIdOf,
  type CommandId,
  type ConfirmedCommand,
  type LedgerStatus,
  type LedgerTransaction,
  type ProjectedLedgerSnapshot,
  type RawLedgerSnapshot,
  type Seq,
  type SyncMark,
  type TransactionId,
} from "./types";

export interface BaseSnapshot {
  readonly snapshot: RawLedgerSnapshot;
  readonly watermark: Seq;
}

export interface LedgerState {
  readonly householdId: string;
  readonly userId: string;
  readonly base: BaseSnapshot | null;
  readonly confirmed: ReadonlyMap<CommandId, ConfirmedCommand>;
  readonly pending: readonly ProjectableCommand[];
  readonly hydrate: { readonly phase: "idle" | "running"; readonly failed: boolean };
  readonly offline: boolean;
}

export type LedgerEvent =
  | { readonly kind: "hydrated"; readonly base: BaseSnapshot }
  | { readonly kind: "hydrate_started" }
  | { readonly kind: "hydrate_failed" }
  | { readonly kind: "outbox_changed"; readonly pending: readonly ProjectableCommand[] }
  | { readonly kind: "command_confirmed"; readonly confirmed: ConfirmedCommand }
  | { readonly kind: "offline_changed"; readonly offline: boolean };

export const initialState = (householdId: string, userId: string): LedgerState => ({
  householdId,
  userId,
  base: null,
  confirmed: new Map(),
  pending: [],
  hydrate: { phase: "idle", failed: false },
  offline: false,
});

export const reduce = (state: LedgerState, event: LedgerEvent): LedgerState => {
  switch (event.kind) {
    case "hydrate_started":
      return { ...state, hydrate: { phase: "running", failed: state.hydrate.failed } };
    case "hydrate_failed":
      return { ...state, hydrate: { phase: "idle", failed: true } };
    case "hydrated":
      return {
        ...state,
        base: event.base,
        hydrate: { phase: "idle", failed: false },
        confirmed: evictAtOrBelow(state.confirmed, event.base.watermark),
      };
    case "outbox_changed":
      return { ...state, pending: event.pending };
    case "command_confirmed":
      return confirmCommand(state, event.confirmed);
    case "offline_changed":
      return { ...state, offline: event.offline };
    default: {
      const _exhaustive: never = event;
      return _exhaustive;
    }
  }
};

export const materialize = (state: LedgerState): readonly LedgerTransaction[] => {
  if (!state.base) return [];
  const queued = unconfirmed(state);
  const acks = [...state.confirmed.values()]
    .sort((left, right) => left.seq - right.seq)
    .map(toProjectable);
  const projected: ProjectedLedgerSnapshot = projectPendingTransactions(state.base.snapshot, [
    ...acks,
    ...queued,
  ]);
  const marks = pendingMarks(queued);
  const accounts = projected.accounts.map(mapSyncedAccount);
  const categories = projected.categories.map(mapSyncedCategory);
  return projected.transactions.map((row) => {
    const commandIds = marks.get(row.id);
    const sync: SyncMark = commandIds ? { kind: "pending", commandIds } : { kind: "confirmed" };
    return {
      ...mapSyncedTransaction(row, accounts, categories),
      version: row.version,
      sync,
    };
  });
};

export const statusOf = (state: LedgerState): LedgerStatus => {
  if (!state.base) {
    if (state.hydrate.failed && state.hydrate.phase !== "running") {
      return {
        phase: "unavailable",
        message: "The ledger snapshot is unavailable. Pull to refresh.",
      };
    }
    return { phase: "hydrating" };
  }
  const queuedCommands = unconfirmed(state).length;
  if (state.offline) return { phase: "ready", queuedCommands, stale: "offline" };
  if (state.hydrate.failed) return { phase: "ready", queuedCommands, stale: "refresh_failed" };
  return { phase: "ready", queuedCommands };
};

export type RowDiff =
  | { readonly op: "insert"; readonly row: LedgerTransaction }
  | { readonly op: "update"; readonly row: LedgerTransaction }
  | { readonly op: "delete"; readonly id: TransactionId };

export const diffRows = (
  previous: readonly LedgerTransaction[],
  next: readonly LedgerTransaction[],
): readonly RowDiff[] => {
  const prevById = new Map(previous.map((row) => [row.id, row]));
  const nextIds = new Set<string>();
  const diffs: RowDiff[] = [];
  for (const row of next) {
    nextIds.add(row.id);
    const prior = prevById.get(row.id);
    if (!prior) {
      diffs.push({ op: "insert", row });
      continue;
    }
    if (!sameRow(prior, row)) diffs.push({ op: "update", row });
  }
  for (const row of previous) {
    if (!nextIds.has(row.id)) diffs.push({ op: "delete", id: asTransactionId(row.id) });
  }
  return diffs;
};

const unconfirmed = (state: LedgerState): readonly ProjectableCommand[] =>
  state.pending.filter((command) => !state.confirmed.has(asCommandId(command.commandId)));

const confirmCommand = (state: LedgerState, confirmed: ConfirmedCommand): LedgerState => {
  if (state.confirmed.has(confirmed.commandId)) return state;
  if (state.base && confirmed.seq <= state.base.watermark) return state;
  const next = new Map(state.confirmed);
  next.set(confirmed.commandId, confirmed);
  return { ...state, confirmed: next };
};

const evictAtOrBelow = (
  confirmed: ReadonlyMap<CommandId, ConfirmedCommand>,
  watermark: Seq,
): ReadonlyMap<CommandId, ConfirmedCommand> => {
  let changed = false;
  const next = new Map<CommandId, ConfirmedCommand>();
  for (const [commandId, entry] of confirmed) {
    if (entry.seq <= watermark) {
      changed = true;
      continue;
    }
    next.set(commandId, entry);
  }
  return changed ? next : confirmed;
};

const toProjectable = (entry: ConfirmedCommand): ProjectableCommand => ({
  ...entry.command,
  status: "pending",
});

const pendingMarks = (
  queued: readonly CommandEnvelope[],
): ReadonlyMap<string, readonly string[]> => {
  const marks = new Map<string, string[]>();
  for (const command of queued) {
    const transactionId = transactionIdOf(command);
    if (!transactionId) continue;
    const commandIds = marks.get(transactionId);
    if (commandIds) commandIds.push(command.commandId);
    else marks.set(transactionId, [command.commandId]);
  }
  return marks;
};

const ROW_FIELDS = [
  "id",
  "version",
  "type",
  "amount",
  "date",
  "accountId",
  "toAccountId",
  "categoryId",
  "description",
  "currency",
] as const;

const sameRow = (left: LedgerTransaction, right: LedgerTransaction): boolean =>
  ROW_FIELDS.every((field) => left[field] === right[field]) && sameSync(left.sync, right.sync);

const sameSync = (left: SyncMark, right: SyncMark): boolean => {
  if (left.kind !== right.kind) return false;
  if (left.kind === "confirmed" || right.kind === "confirmed") return true;
  return (
    left.commandIds.length === right.commandIds.length &&
    left.commandIds.every((commandId, index) => commandId === right.commandIds[index])
  );
};

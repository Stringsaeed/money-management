import { and, asc, eq, inArray } from "drizzle-orm";
import type { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";

import type { CommandEnvelope, CommandKind, CommandResult, Precondition } from "@trove/protocol";

import { outboxCommands, syncState } from "@/db/schema";

/**
 * Client outbox & sync core (#85). Pure data layer over the local SQLite
 * tables (`outbox_commands`, `sync_state`); the React scheduling shell lives
 * in `hooks/use-sync-worker.ts`.
 *
 * Ordering rule: the outbox drains strictly in FIFO order and stops at the
 * first transport failure. Commands are idempotent server-side (#83 replays
 * stored results by commandId), so re-sending after a crash mid-send is safe
 * — a "sending" row left behind by a killed app is simply retried.
 */

type LocalDb = ExpoSQLiteDatabase<typeof import("@/db/schema")>;

/** Transport seam so the core stays testable without oRPC. */
export type SendCommand = (envelope: CommandEnvelope) => Promise<CommandResult>;

export interface EnqueueInput {
  /** Client-generated idempotency key (UUID). */
  commandId: string;
  householdId: string;
  kind: CommandKind;
  payload: unknown;
  preconditions?: readonly Precondition[];
}

/**
 * Appends one command to the outbox. Callers apply their optimistic local
 * writes and enqueue inside ONE local transaction (`db.withTransactionAsync`)
 * so a crash can never leave cache and queue disagreeing.
 */
export async function enqueueCommand(db: LocalDb, input: EnqueueInput): Promise<void> {
  await db
    .insert(outboxCommands)
    .values({
      commandId: input.commandId,
      householdId: input.householdId,
      kind: input.kind,
      payload: JSON.stringify(input.payload),
      ...(input.preconditions && {
        preconditions: JSON.stringify([...input.preconditions]),
      }),
    })
    .onConflictDoNothing();
}

function envelopeFrom(row: typeof outboxCommands.$inferSelect): CommandEnvelope {
  return {
    commandId: row.commandId,
    householdId: row.householdId,
    kind: row.kind as CommandEnvelope["kind"],
    payload: JSON.parse(row.payload) as unknown,
    preconditions: row.preconditions
      ? (JSON.parse(row.preconditions) as Precondition[])
      : undefined,
  };
}

const QUEUED_STATUSES = ["pending", "sending"] as const;

export interface DrainSummary {
  /** Commands acknowledged as applied and removed from the outbox. */
  applied: number;
  /** Commands the server rejected with a typed reason (inbox candidates). */
  rejected: number;
  /** Commands still waiting after this drain pass. */
  pending: number;
  /**
   * "network" when a transport error stopped the drain to preserve FIFO
   * ordering; absent when the outbox emptied.
   */
  stoppedOnNetworkError?: boolean;
  /**
   * The server refused writes via the remote kill switch (#99): commands
   * stay queued (never rejected) until sync is re-enabled.
   */
  stoppedOnLocalOnly?: boolean;
}

/**
 * Drains queued commands to `commands.apply` in FIFO order. A typed
 * rejection (`stale_version`, `invalid_intent`, …) does NOT stop the drain —
 * later commands stay valid; the rejected one is retained with its reason.
 * A transport failure stops immediately: order matters more than throughput.
 */
export async function drainOutbox(db: LocalDb, send: SendCommand): Promise<DrainSummary> {
  let applied = 0;
  let rejected = 0;

  // Loop one row at a time so each send sees the freshest head; statuses
  // change between iterations.
  for (;;) {
    const rows = await db
      .select()
      .from(outboxCommands)
      .where(inArray(outboxCommands.status, [...QUEUED_STATUSES]))
      .orderBy(asc(outboxCommands.createdAt), asc(outboxCommands.commandId))
      .limit(1);
    const row = rows[0];
    if (!row) {
      break;
    }

    await db
      .update(outboxCommands)
      .set({ status: "sending", attempts: row.attempts + 1, lastAttemptAt: new Date() })
      .where(eq(outboxCommands.commandId, row.commandId));

    let result: CommandResult;
    try {
      result = await send(envelopeFrom(row));
    } catch {
      // Transport failure — put the row back to pending for the next pass.
      await db
        .update(outboxCommands)
        .set({ status: "pending", attempts: row.attempts + 1, lastAttemptAt: new Date() })
        .where(eq(outboxCommands.commandId, row.commandId));
      return {
        applied,
        rejected,
        pending: await countQueued(db),
        stoppedOnNetworkError: true,
      };
    }

    if (result.kind === "applied") {
      // Acked — the idempotency store owns the history now.
      await db.delete(outboxCommands).where(eq(outboxCommands.commandId, row.commandId));
      applied += 1;
    } else if (result.kind === "local_only") {
      // Remote kill switch (#99): not a rejection. Put the row back to
      // pending and stop — the server refuses everything until it is off.
      await db
        .update(outboxCommands)
        .set({ status: "pending" })
        .where(eq(outboxCommands.commandId, row.commandId));
      return {
        applied,
        rejected,
        pending: await countQueued(db),
        stoppedOnLocalOnly: true,
      };
    } else {
      await db
        .update(outboxCommands)
        .set({
          status: "rejected",
          rejectionKind: result.kind,
          rejectionPayload: JSON.stringify(result),
        })
        .where(eq(outboxCommands.commandId, row.commandId));
      rejected += 1;
    }
  }

  return { applied, rejected, pending: 0 };
}

/** Number of commands awaiting their first ack. */
async function countQueued(db: LocalDb): Promise<number> {
  const rows = await db
    .select({ commandId: outboxCommands.commandId })
    .from(outboxCommands)
    .where(inArray(outboxCommands.status, [...QUEUED_STATUSES]));
  return rows.length;
}

export interface SyncPullArgs {
  householdId: string;
  since: number;
}

/** Notification-shaped delta, matching the protocol's sync contract. */
export interface DeltaPull {
  readonly seq: number;
  readonly hasMore: boolean;
  readonly changes: readonly { seq: number; effects: readonly string[] }[];
}

/** Transport seam mirroring `orpc.sync.getDelta`. */
export type FetchDelta = (args: SyncPullArgs) => Promise<DeltaPull>;

/**
 * Pulls deltas since the persisted per-household watermark and advances it to
 * exactly what was delivered. The watermark survives restarts, so a fresh
 * launch resumes where the previous session stopped instead of re-pulling.
 */
export async function pullDeltas(
  db: LocalDb,
  fetch: FetchDelta,
  householdId: string,
): Promise<{
  seq: number;
  hasMore: boolean;
  changes: readonly { seq: number; effects: readonly string[] }[];
}> {
  const stateRows = await db
    .select()
    .from(syncState)
    .where(eq(syncState.householdId, householdId))
    .limit(1);
  const since = stateRows[0]?.watermark ?? 0;

  const delta = await fetch({ householdId, since });

  await db
    .insert(syncState)
    .values({ householdId, watermark: delta.seq, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: syncState.householdId,
      set: { watermark: delta.seq, updatedAt: new Date() },
    });

  return delta;
}

export interface RejectedChange {
  commandId: string;
  householdId: string;
  kind: CommandKind;
  rejectionKind: string;
  rejectionPayload: CommandResult;
  attempts: number;
  createdAt: Date;
}

/** The Rejected Changes inbox: every command the server refused, with why. */
export async function listRejectedChanges(
  db: LocalDb,
  householdId: string,
): Promise<readonly RejectedChange[]> {
  const rows = await db
    .select()
    .from(outboxCommands)
    .where(and(eq(outboxCommands.householdId, householdId), eq(outboxCommands.status, "rejected")))
    .orderBy(asc(outboxCommands.createdAt));
  return rows.map((row) => ({
    commandId: row.commandId,
    householdId: row.householdId,
    kind: row.kind as CommandKind,
    rejectionKind: row.rejectionKind ?? "unknown",
    rejectionPayload: JSON.parse(row.rejectionPayload ?? "{}") as CommandResult,
    attempts: row.attempts,
    createdAt: row.createdAt,
  }));
}

/**
 * Re-queues a rejected command. Safe because commandIds are idempotency
 * keys: if the server actually applied it before rejecting-looking timeout,
 * the retry replays the stored result instead of double-applying.
 */
export async function retryRejectedCommand(db: LocalDb, commandId: string): Promise<void> {
  await db
    .update(outboxCommands)
    .set({ status: "pending", rejectionKind: null, rejectionPayload: null })
    .where(and(eq(outboxCommands.commandId, commandId), eq(outboxCommands.status, "rejected")));
}

/** Drops a rejected command the user chose not to re-edit. */
export async function discardRejectedCommand(db: LocalDb, commandId: string): Promise<void> {
  await db
    .delete(outboxCommands)
    .where(and(eq(outboxCommands.commandId, commandId), eq(outboxCommands.status, "rejected")));
}

/** Count of commands still awaiting their first ack. */
export async function countPendingCommands(db: LocalDb, householdId: string): Promise<number> {
  const rows = await db
    .select({ commandId: outboxCommands.commandId })
    .from(outboxCommands)
    .where(
      and(
        eq(outboxCommands.householdId, householdId),
        inArray(outboxCommands.status, [...QUEUED_STATUSES]),
      ),
    );
  return rows.length;
}

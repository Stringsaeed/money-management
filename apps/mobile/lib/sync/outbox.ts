import { and, asc, eq, inArray } from "drizzle-orm";
import type { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import type { SQLiteDatabase } from "expo-sqlite";

import type { CommandEnvelope, CommandKind, CommandResult, Precondition } from "@trove/protocol";

import { outboxCommands, syncState } from "@/db/schema";
import { parseRejection, type RejectionResult } from "@/lib/sync/rejection";
import type * as schema from "@/db/schema";

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

export type LocalDb = ExpoSQLiteDatabase<typeof schema> & { $client: SQLiteDatabase };

/** Transport seam so the core stays testable without oRPC. */
export type SendCommand = (envelope: CommandEnvelope) => Promise<CommandResult>;

export interface EnqueueInput {
  /** Client-generated idempotency key (UUID). */
  commandId: string;
  householdId: string;
  kind: CommandKind;
  payload: CommandEnvelope["payload"];
  preconditions?: readonly Precondition[];
  userId?: string;
}

interface StoredCommandPayload {
  readonly storageVersion: 1;
  readonly userId: string;
  readonly payload: CommandEnvelope["payload"];
}

interface DecodedCommandPayload {
  readonly userId: string | null;
  readonly payload: CommandEnvelope["payload"];
}

const encodeStoredPayload = (payload: CommandEnvelope["payload"], userId?: string): string =>
  JSON.stringify(userId ? { storageVersion: 1, userId, payload } : payload);

function decodeStoredPayload(serialized: string): DecodedCommandPayload {
  // SAFETY: tagged values are written only by encodeStoredPayload; untagged values are legacy rows.
  const candidate = JSON.parse(serialized) as Partial<StoredCommandPayload>;
  if (candidate?.storageVersion === 1 && candidate.userId) {
    return { userId: candidate.userId, payload: candidate.payload };
  }
  return { userId: null, payload: candidate };
}

const rowBelongsToUser = (row: typeof outboxCommands.$inferSelect, userId?: string): boolean =>
  !userId || decodeStoredPayload(row.payload).userId === userId;
/** Appends one durable command to the selected household's FIFO outbox. */
export async function enqueueCommand(db: LocalDb, input: EnqueueInput): Promise<void> {
  await db
    .insert(outboxCommands)
    .values({
      commandId: input.commandId,
      householdId: input.householdId,
      kind: input.kind,
      payload: encodeStoredPayload(input.payload, input.userId),
      ...(input.preconditions && {
        preconditions: JSON.stringify([...input.preconditions]),
      }),
    })
    .onConflictDoNothing();
}

function envelopeFrom(row: typeof outboxCommands.$inferSelect): CommandEnvelope {
  // SAFETY: rows come from the typed outbox schema and were serialized by enqueueCommand.
  return {
    commandId: row.commandId,
    householdId: row.householdId,
    kind: row.kind as CommandEnvelope["kind"],
    payload: decodeStoredPayload(row.payload).payload,
    preconditions: row.preconditions
      ? (JSON.parse(row.preconditions) as Precondition[])
      : undefined,
    issuedAt: row.createdAt.toISOString(),
  };
}

const QUEUED_STATUSES = ["pending", "sending"] as const;
export interface ProjectableCommand extends CommandEnvelope {
  readonly status: (typeof QUEUED_STATUSES)[number];
}

/** Pending optimistic intents for one selected household, in projector order. */
export async function listProjectableCommands(
  db: LocalDb,
  householdId: string,
  userId?: string,
): Promise<readonly ProjectableCommand[]> {
  const rows = await db
    .select()
    .from(outboxCommands)
    .where(
      and(
        eq(outboxCommands.householdId, householdId),
        inArray(outboxCommands.status, [...QUEUED_STATUSES]),
      ),
    )
    .orderBy(asc(outboxCommands.createdAt), asc(outboxCommands.commandId))
    .all();
  return rows
    .filter((row) => rowBelongsToUser(row, userId))
    .map((row) => ({
      ...envelopeFrom(row),
      status: row.status === "sending" ? "sending" : "pending",
    }));
}

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
export async function drainOutbox(
  db: LocalDb,
  householdId: string,
  send: SendCommand,
  userId?: string,
): Promise<DrainSummary> {
  let applied = 0;
  let rejected = 0;

  // Loop one row at a time so each send sees the freshest head; statuses
  // change between iterations.
  for (;;) {
    const rows = await db
      .select()
      .from(outboxCommands)
      .where(
        and(
          eq(outboxCommands.householdId, householdId),
          inArray(outboxCommands.status, [...QUEUED_STATUSES]),
        ),
      )
      .orderBy(asc(outboxCommands.createdAt), asc(outboxCommands.commandId))
      .all();
    const row = rows.find((candidate) => rowBelongsToUser(candidate, userId));
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
        pending: await countQueued(db, householdId, userId),
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
        pending: await countQueued(db, householdId, userId),
        stoppedOnLocalOnly: true,
      };
    } else {
      await db.$client.withTransactionAsync(async () => {
        await db
          .update(outboxCommands)
          .set({
            status: "rejected",
            rejectionKind: result.kind,
            rejectionPayload: JSON.stringify(result),
          })
          .where(eq(outboxCommands.commandId, row.commandId));
        if (result.kind === "invalid_intent") {
          await rebaseInvalidDependents(db, householdId, userId, envelopeFrom(row));
        }
      });
      rejected += 1;
    }
  }

  return { applied, rejected, pending: 0 };
}

async function rebaseInvalidDependents(
  db: LocalDb,
  householdId: string,
  userId: string | undefined,
  rejectedCommand: CommandEnvelope,
): Promise<void> {
  const entityId = mutableEntityId(rejectedCommand);
  if (!entityId) return;
  const rows = await db
    .select()
    .from(outboxCommands)
    .where(
      and(
        eq(outboxCommands.householdId, householdId),
        inArray(outboxCommands.status, [...QUEUED_STATUSES]),
      ),
    )
    .orderBy(asc(outboxCommands.createdAt), asc(outboxCommands.commandId))
    .all();

  for (const row of rows) {
    if (!rowBelongsToUser(row, userId)) continue;
    const command = envelopeFrom(row);
    if (mutableEntityId(command) !== entityId || !command.preconditions) continue;
    const preconditions = command.preconditions.map((precondition) =>
      precondition.entityId === entityId && precondition.expectedVersion !== undefined
        ? { ...precondition, expectedVersion: Math.max(0, precondition.expectedVersion - 1) }
        : precondition,
    );
    await db
      .update(outboxCommands)
      .set({ preconditions: JSON.stringify(preconditions) })
      .where(eq(outboxCommands.commandId, row.commandId));
  }
}

function mutableEntityId(command: CommandEnvelope): string | null {
  if (command.kind === "transaction.edit" || command.kind === "transaction.remove") {
    const payload = command.payload as { transactionId: string };
    return payload.transactionId;
  }
  if (command.kind === "account.update" || command.kind === "account.archive") {
    const payload = command.payload as { accountId: string };
    return payload.accountId;
  }
  return null;
}

/** Number of commands awaiting their first ack. */
async function countQueued(db: LocalDb, householdId: string, userId?: string): Promise<number> {
  const rows = await db
    .select()
    .from(outboxCommands)
    .where(
      and(
        eq(outboxCommands.householdId, householdId),
        inArray(outboxCommands.status, [...QUEUED_STATUSES]),
      ),
    );
  return rows.filter((row) => rowBelongsToUser(row, userId)).length;
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
  /** Typed rejection mirrored from the commands mutation (#94). */
  rejection: RejectionResult;
  /** Original intent payload, used to pre-populate the re-edit form. */
  payload: unknown;
  preconditions?: readonly Precondition[];
  attempts: number;
  createdAt: Date;
}

function rejectedChangeFrom(row: typeof outboxCommands.$inferSelect): RejectedChange {
  // SAFETY: rows come from the typed outbox schema and were serialized by enqueueCommand.
  return {
    commandId: row.commandId,
    householdId: row.householdId,
    kind: row.kind as CommandKind,
    rejectionKind: row.rejectionKind ?? "unknown",
    rejection: parseRejection(JSON.parse(row.rejectionPayload ?? "{}")),
    payload: decodeStoredPayload(row.payload).payload,
    ...(row.preconditions && {
      preconditions: JSON.parse(row.preconditions) as Precondition[],
    }),
    attempts: row.attempts,
    createdAt: row.createdAt,
  };
}

/** The Rejected Changes inbox: every command the server refused, with why. */
export async function listRejectedChanges(
  db: LocalDb,
  householdId: string,
  userId?: string,
): Promise<readonly RejectedChange[]> {
  const rows = await db
    .select()
    .from(outboxCommands)
    .where(and(eq(outboxCommands.householdId, householdId), eq(outboxCommands.status, "rejected")))
    .orderBy(asc(outboxCommands.createdAt));
  return rows.filter((row) => rowBelongsToUser(row, userId)).map(rejectedChangeFrom);
}

/** Loads one rejected change for the re-edit screen; null when gone. */
export async function getRejectedChange(
  db: LocalDb,
  commandId: string,
  userId?: string,
): Promise<RejectedChange | null> {
  const rows = await db
    .select()
    .from(outboxCommands)
    .where(and(eq(outboxCommands.commandId, commandId), eq(outboxCommands.status, "rejected")))
    .limit(1);
  const row = rows[0];
  return row && rowBelongsToUser(row, userId) ? rejectedChangeFrom(row) : null;
}

/**
 * Re-queues an edited rejected command under a NEW commandId (#94). The fresh
 * id is a new idempotency key, so the resubmission applies exactly once even
 * if the original somehow landed server-side. Original row and replacement
 * swap in one transaction so the inbox never shows both.
 */
export async function resubmitRejectedCommand(
  db: LocalDb,
  input: {
    originalCommandId: string;
    newCommandId: string;
    /** Edited payload; defaults to the original intent unchanged. */
    payload?: CommandEnvelope["payload"];
  },
): Promise<void> {
  await db.$client.withTransactionAsync(async () => {
    const rows = await db
      .select()
      .from(outboxCommands)
      .where(
        and(
          eq(outboxCommands.commandId, input.originalCommandId),
          eq(outboxCommands.status, "rejected"),
        ),
      )
      .limit(1);
    const original = rows[0];
    if (!original) {
      throw new Error(
        "Nothing to resubmit — this rejected change was already discarded or resubmitted.",
      );
    }
    const stored = decodeStoredPayload(original.payload);

    await db
      .insert(outboxCommands)
      .values({
        commandId: input.newCommandId,
        householdId: original.householdId,
        kind: original.kind,
        payload:
          input.payload === undefined
            ? original.payload
            : encodeStoredPayload(input.payload, stored.userId ?? undefined),
        ...(original.preconditions && { preconditions: original.preconditions }),
      })
      .onConflictDoNothing();

    await db.delete(outboxCommands).where(eq(outboxCommands.commandId, original.commandId));
  });
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
export async function countPendingCommands(
  db: LocalDb,
  householdId: string,
  userId?: string,
): Promise<number> {
  const rows = await db
    .select()
    .from(outboxCommands)
    .where(
      and(
        eq(outboxCommands.householdId, householdId),
        inArray(outboxCommands.status, [...QUEUED_STATUSES]),
      ),
    );
  return rows.filter((row) => rowBelongsToUser(row, userId)).length;
}

/**
 * Drops every queued/rejected command for a household (#98): once the
 * local-to-cloud migration's manifest matches, nothing predating sync mode
 * is worth replaying — the household's entire pre-sync history just landed
 * as `import_bundle` commands instead.
 */
export async function truncateOutbox(db: LocalDb, householdId: string): Promise<void> {
  await db.delete(outboxCommands).where(eq(outboxCommands.householdId, householdId));
}

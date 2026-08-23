import type { EffectTag } from "@trove/protocol";
import { and, asc, eq, gt, sql } from "drizzle-orm";
import { ORPCError } from "@orpc/server";

import { householdChange } from "@trove/db/schema/commands";
import { membership } from "@trove/db/schema/household";

import type { CommandDatabase } from "../commands/types";

/**
 * Delta pull result. Entries are notification-shaped (`{seq, effects}`) and
 * carry no raw row data — clients invalidate local caches by effect tag;
 * authoritative rows arrive through command results and later sync payloads.
 */
export interface SyncDeltaEntry {
  readonly seq: number;
  readonly effects: readonly EffectTag[];
}

export interface GetDeltaArgs {
  db: CommandDatabase;
  /** Caller's user id — membership is verified before any change data is read. */
  userId: string;
  householdId: string;
  /** Client watermark: only changes with `seq > since` are returned. */
  since: number;
  limit?: number;
}

export interface SyncDelta {
  /**
   * The household's current head sequence — the watermark to send as `since`
   * on the next poll.
   */
  readonly seq: number;
  /** True when more than `limit` changes exist past `since`; keep pulling. */
  readonly hasMore: boolean;
  readonly changes: readonly SyncDeltaEntry[];
}

export const DEFAULT_DELTA_LIMIT = 500;
export const MAX_DELTA_LIMIT = 1000;

export async function getDelta({
  db,
  userId,
  householdId,
  since,
  limit = DEFAULT_DELTA_LIMIT,
}: GetDeltaArgs): Promise<SyncDelta> {
  // Household tenancy is enforced here at the API boundary — D1 has no RLS
  // equivalent and no DB-level backstop, so this check guards every read.
  const memberRows = await db
    .select({ id: membership.id })
    .from(membership)
    .where(and(eq(membership.userId, userId), eq(membership.householdId, householdId)))
    .limit(1);
  if (!memberRows[0]) {
    throw new ORPCError("FORBIDDEN", {
      message: "You are not a member of this household.",
    });
  }

  const boundedLimit = Math.min(limit, MAX_DELTA_LIMIT);

  // Page + head run in one batch so both reads see the same snapshot — a
  // commit landing mid-poll can never make the watermark outrun the page.
  const [pageResult, headResult] = await db.batch([
    db
      .select({ seq: householdChange.seq, effects: householdChange.effects })
      .from(householdChange)
      .where(and(eq(householdChange.householdId, householdId), gt(householdChange.seq, since)))
      .orderBy(asc(householdChange.seq))
      .limit(boundedLimit),
    // Head watermark: MAX(seq) for the household — 0 for an empty log.
    db
      .select({ seq: sql<number>`COALESCE(MAX(${householdChange.seq}), 0)` })
      .from(householdChange)
      .where(eq(householdChange.householdId, householdId)),
  ]);

  const changeRows = pageResult;
  const hasMore = changeRows.length === boundedLimit;
  const head = headResult[0]?.seq ?? 0;

  // The returned `seq` must never exceed what this response actually
  // delivered: a truncated page (hasMore) reports its last row so the next
  // poll re-fetches from there instead of skipping undelivered changes.
  const lastDelivered = changeRows[changeRows.length - 1]?.seq ?? since;

  return {
    seq: hasMore ? lastDelivered : head,
    hasMore,
    changes: changeRows.map((row) => ({ seq: row.seq, effects: row.effects })),
  };
}

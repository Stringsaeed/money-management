import { and, desc, eq, gte, lte } from "drizzle-orm";

import { user } from "@trove/db/schema/auth";
import { householdChange } from "@trove/db/schema/commands";

import type { EffectTag } from "@trove/protocol";
import type { CommandDatabase } from "../commands/types";
import { requireHouseholdMember } from "../require-member";
import { summarizeEffects } from "./summary";

export const DEFAULT_ACTIVITY_LIMIT = 50;
export const MAX_ACTIVITY_LIMIT = 200;

/** One decoded activity-timeline entry. */
export interface ActivityEntry {
  readonly seq: number;
  readonly commandId: string;
  /** Authenticated user the change was attributed to. */
  readonly userId: string;
  readonly userName: string;
  readonly createdAt: string;
  readonly effects: readonly EffectTag[];
  /** Human-readable action summary decoded from `effects`. */
  readonly summary: string;
}

export interface ActivityPage {
  readonly changes: readonly ActivityEntry[];
  readonly hasMore: boolean;
}

export interface GetActivityArgs {
  db: CommandDatabase;
  /** Caller's user id — membership is verified before any change data is read. */
  readonly userId: string;
  readonly householdId: string;
  /** Page size; the response reports `hasMore` when truncated. */
  readonly limit?: number;
  /** Offset pagination — fine on D1 where the log is append-only per household. */
  readonly offset?: number;
  /** Restrict the timeline to one member's changes. */
  readonly filterUserId?: string;
  /** Inclusive lower bound on `createdAt`. */
  readonly from?: Date;
  /** Inclusive upper bound on `createdAt`. */
  readonly to?: Date;
}

/**
 * Household activity history read surface (#95). Newest-first page of
 * committed changes joined with the acting user's name; effects are decoded
 * into a human-readable action summary here so every client shares one copy.
 *
 * D1 has no RLS: the membership gate plus the household-scoped WHERE clause
 * ARE the tenancy boundary.
 */
export async function getActivity({
  db,
  userId,
  householdId,
  limit = DEFAULT_ACTIVITY_LIMIT,
  offset = 0,
  filterUserId,
  from,
  to,
}: GetActivityArgs): Promise<ActivityPage> {
  await requireHouseholdMember(db, userId, householdId);

  const boundedLimit = Math.min(Math.max(limit, 1), MAX_ACTIVITY_LIMIT);
  const boundedOffset = Math.max(offset, 0);

  const rows = await db
    .select({
      seq: householdChange.seq,
      commandId: householdChange.commandId,
      userId: householdChange.userId,
      createdAt: householdChange.createdAt,
      effects: householdChange.effects,
      userName: user.name,
    })
    .from(householdChange)
    .innerJoin(user, eq(user.id, householdChange.userId))
    .where(
      and(
        eq(householdChange.householdId, householdId),
        ...(filterUserId ? [eq(householdChange.userId, filterUserId)] : []),
        ...(from ? [gte(householdChange.createdAt, from)] : []),
        ...(to ? [lte(householdChange.createdAt, to)] : []),
      ),
    )
    .orderBy(desc(householdChange.seq))
    .offset(boundedOffset)
    .limit(boundedLimit + 1);

  const hasMore = rows.length > boundedLimit;
  return {
    hasMore,
    changes: rows.slice(0, boundedLimit).map((row) => ({
      seq: row.seq,
      commandId: row.commandId,
      userId: row.userId,
      userName: row.userName,
      createdAt: row.createdAt.toISOString(),
      effects: row.effects,
      summary: summarizeEffects(row.effects),
    })),
  };
}

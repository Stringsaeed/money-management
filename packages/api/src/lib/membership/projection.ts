import { and, eq, inArray, lt, ne, notInArray, sql } from "drizzle-orm";

import { type MembershipStatus, household, membership } from "@trove/db/schema/household";
import { user } from "@trove/db/schema/auth";

import type { CommandDatabase } from "../commands/types";

/**
 * One observation of a WorkOS organization membership, from any source: a
 * verified webhook event, a bootstrap list read, or the response to a
 * mutation Trove itself issued. `observedAt` is the WorkOS-side time the fact
 * was true (event `created_at` or membership `updated_at`).
 */
export interface MembershipObservation {
  readonly membershipId: string;
  readonly organizationId: string;
  readonly userId: string;
  readonly roleSlug: string;
  readonly status: MembershipStatus;
  readonly observedAt: Date;
  /** WorkOS event id when the observation came from a webhook. */
  readonly eventId: string | null;
  readonly createdAt: Date;
}

export type ProjectionOutcome = "applied" | "ignored" | "unknown_household" | "unknown_user";

/**
 * Applies one observation to the Membership projection.
 *
 * The ordering rule is the whole contract: an observation wins only when it is
 * newer than what is projected, or is the very same event replayed. Duplicate,
 * reordered, and delayed deliveries therefore converge on the newest fact
 * without any per-source sequencing. A membership deletion is projected as an
 * `inactive` tombstone, so a stale `created` that arrives later loses to it.
 *
 * Only Households Trove created and Users Trove has projected are written;
 * anything else is reported so the caller can decide whether to project the
 * missing row first.
 */
export async function projectMembership(
  db: CommandDatabase,
  observation: MembershipObservation,
): Promise<ProjectionOutcome> {
  const [householdRow, userRow] = await Promise.all([
    db
      .select({ id: household.id })
      .from(household)
      .where(eq(household.id, observation.organizationId))
      .limit(1),
    db.select({ id: user.id }).from(user).where(eq(user.id, observation.userId)).limit(1),
  ]);
  if (!householdRow[0]) return "unknown_household";
  if (!userRow[0]) return "unknown_user";

  const written = await db
    .insert(membership)
    .values({
      id: observation.membershipId,
      userId: observation.userId,
      householdId: observation.organizationId,
      role: observation.roleSlug,
      status: observation.status,
      observedAt: observation.observedAt,
      observedEventId: observation.eventId,
      createdAt: observation.createdAt,
    })
    .onConflictDoUpdate({
      target: [membership.householdId, membership.userId],
      set: {
        id: sql`excluded.id`,
        role: sql`excluded.role`,
        status: sql`excluded.status`,
        observedAt: sql`excluded.observed_at`,
        observedEventId: sql`excluded.observed_event_id`,
      },
      setWhere: sql`${membership.observedAt} < excluded.observed_at
        OR (${membership.observedAt} = excluded.observed_at
          AND ${membership.observedEventId} IS NOT DISTINCT FROM excluded.observed_event_id)`,
    })
    .returning({ id: membership.id });
  return written.length > 0 ? "applied" : "ignored";
}

/**
 * Tombstones every non-inactive membership of `userId` whose Household is not
 * in `listedHouseholdIds`, dated at the instant the authoritative list was
 * requested. A membership created after that instant carries a newer
 * observation and is left alone, which is what makes the bootstrap safe to
 * run while events are still arriving.
 */
export async function tombstoneUnlistedUserMemberships(
  db: CommandDatabase,
  userId: string,
  listedHouseholdIds: readonly string[],
  listedAt: Date,
): Promise<number> {
  const rows = await db
    .update(membership)
    .set({ status: "inactive", observedAt: listedAt, observedEventId: null })
    .where(
      and(
        eq(membership.userId, userId),
        ne(membership.status, "inactive"),
        lt(membership.observedAt, listedAt),
        listedHouseholdIds.length > 0
          ? notInArray(membership.householdId, [...listedHouseholdIds])
          : undefined,
      ),
    )
    .returning({ id: membership.id });
  return rows.length;
}

/** Household-side counterpart of {@link tombstoneUnlistedUserMemberships}. */
export async function tombstoneUnlistedHouseholdMemberships(
  db: CommandDatabase,
  householdId: string,
  listedMembershipIds: readonly string[],
  listedAt: Date,
): Promise<number> {
  const rows = await db
    .update(membership)
    .set({ status: "inactive", observedAt: listedAt, observedEventId: null })
    .where(
      and(
        eq(membership.householdId, householdId),
        ne(membership.status, "inactive"),
        lt(membership.observedAt, listedAt),
        listedMembershipIds.length > 0
          ? notInArray(membership.id, [...listedMembershipIds])
          : undefined,
      ),
    )
    .returning({ id: membership.id });
  return rows.length;
}

/**
 * Tombstones one membership Trove itself just deleted in WorkOS. The deletion
 * event that follows carries the same fact and is absorbed by the ordering rule.
 */
export async function tombstoneMembership(
  db: CommandDatabase,
  membershipId: string,
  observedAt: Date,
): Promise<void> {
  await db
    .update(membership)
    .set({ status: "inactive", observedAt, observedEventId: null })
    .where(and(eq(membership.id, membershipId), lt(membership.observedAt, observedAt)));
}

/**
 * An Organization deleted in WorkOS denies everyone; the Household row and
 * its ledger data stay until an explicit app-owned delete removes them.
 */
export async function tombstoneHousehold(
  db: CommandDatabase,
  householdId: string,
  observedAt: Date,
): Promise<number> {
  const rows = await db
    .update(membership)
    .set({ status: "inactive", observedAt, observedEventId: null })
    .where(
      and(
        eq(membership.householdId, householdId),
        inArray(membership.status, ["active", "pending"]),
        lt(membership.observedAt, observedAt),
      ),
    )
    .returning({ id: membership.id });
  return rows.length;
}

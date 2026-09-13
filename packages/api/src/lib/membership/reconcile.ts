import { eq, inArray } from "drizzle-orm";

import type { DirectoryMembership, HouseholdDirectory, HouseholdEvent } from "@trove/auth";
import { user } from "@trove/db/schema/auth";
import { household } from "@trove/db/schema/household";

import { ensureUserProjection } from "../commands/scope";
import type { CommandDatabase } from "../commands/types";
import { hasPgCode } from "../pg-error";
import {
  type MembershipObservation,
  type ProjectionOutcome,
  projectMembership,
  tombstoneHousehold,
  tombstoneUnlistedHouseholdMemberships,
  tombstoneUnlistedUserMemberships,
} from "./projection";

export interface MembershipDeps {
  readonly db: CommandDatabase;
  readonly directory: HouseholdDirectory;
  readonly now: () => Date;
}

/** A per-User bootstrap older than this is refreshed on the next read. */
export const USER_RECONCILE_MAX_AGE_MS = 60_000;
/** A per-Household member list older than this is refreshed on the next read. */
export const HOUSEHOLD_RECONCILE_MAX_AGE_MS = 60_000;
/** Sync Stream token issuance refreshes a bootstrap older than this. */
export const TOKEN_RECONCILE_MAX_AGE_MS = 5 * 60_000;

export function isStale(reconciledAt: Date | null, now: Date, maxAgeMs: number): boolean {
  return reconciledAt === null || now.getTime() - reconciledAt.getTime() > maxAgeMs;
}

/** A directory row as an observation; `updatedAt` is when WorkOS last changed it. */
export function observationFromDirectory(
  row: DirectoryMembership,
  overrides: Partial<Pick<MembershipObservation, "status" | "observedAt" | "eventId">> = {},
): MembershipObservation {
  return {
    membershipId: row.id,
    organizationId: row.organizationId,
    userId: row.userId,
    roleSlug: row.roleSlug,
    status: row.status,
    observedAt: row.updatedAt,
    eventId: null,
    createdAt: row.createdAt,
    ...overrides,
  };
}

/** Projects a User Trove has not seen yet, from the directory, so a membership row can reference it. */
async function projectUnknownUser(deps: MembershipDeps, userId: string): Promise<boolean> {
  const { isDeletedIdentity } = await import("../deletion/service");
  if (await isDeletedIdentity(deps.db, userId, "user")) return false;
  const found = await deps.directory.getUser(userId);
  if (!found) return false;
  await ensureUserProjection(deps.db, {
    id: found.id,
    email: found.email,
    name: found.name ?? undefined,
  });
  return true;
}

async function projectWithUser(
  deps: MembershipDeps,
  observation: MembershipObservation,
): Promise<ProjectionOutcome> {
  const outcome = await projectMembership(deps.db, observation);
  if (outcome !== "unknown_user") return outcome;
  if (!(await projectUnknownUser(deps, observation.userId))) return outcome;
  return projectMembership(deps.db, observation);
}

/**
 * Bootstrap for one User: the authoritative list from WorkOS wins over
 * whatever the projection missed. Memberships of Organizations Trove never
 * created are skipped; Trove only administers Households it made.
 */
export async function reconcileUserMemberships(
  deps: MembershipDeps,
  userId: string,
): Promise<void> {
  const listedAt = deps.now();
  const listed = await deps.directory.listUserMemberships(userId);
  const organizationIds = listed.map((row) => row.organizationId);
  const known = new Set(
    organizationIds.length > 0
      ? (
          await deps.db
            .select({ id: household.id })
            .from(household)
            .where(inArray(household.id, organizationIds))
        ).map((row) => row.id)
      : [],
  );
  for (const row of listed) {
    if (known.has(row.organizationId)) {
      await projectMembership(deps.db, observationFromDirectory(row));
    }
  }
  await tombstoneUnlistedUserMemberships(deps.db, userId, organizationIds, listedAt);
  try {
    await deps.db
      .update(user)
      .set({ membershipsReconciledAt: listedAt })
      .where(eq(user.id, userId));
  } catch (error) {
    // Stamp column from 0013 may be missing on drifted prod; skip rather than 500.
    if (error instanceof Error && hasPgCode(error, "42703")) return;
    throw error;
  }
}

export async function reconcileUserMembershipsIfStale(
  deps: MembershipDeps,
  userId: string,
  maxAgeMs: number,
): Promise<void> {
  try {
    const rows = await deps.db
      .select({ reconciledAt: user.membershipsReconciledAt })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
    const row = rows[0];
    if (row && !isStale(row.reconciledAt, deps.now(), maxAgeMs)) return;
  } catch (error) {
    // Without the stamp column we cannot gate freshness — skip reconcile for Sync unblock.
    if (error instanceof Error && hasPgCode(error, "42703")) return;
    throw error;
  }
  await reconcileUserMemberships(deps, userId);
}

/** Bootstrap for one Household: every member WorkOS lists, with Users projected as needed. */
export async function reconcileHouseholdMembers(
  deps: MembershipDeps,
  householdId: string,
): Promise<void> {
  const listedAt = deps.now();
  const listed = await deps.directory.listOrganizationMemberships(householdId);
  for (const row of listed) {
    await projectWithUser(deps, observationFromDirectory(row));
  }
  await tombstoneUnlistedHouseholdMemberships(
    deps.db,
    householdId,
    listed.map((row) => row.id),
    listedAt,
  );
  await deps.db
    .update(household)
    .set({ membersReconciledAt: listedAt })
    .where(eq(household.id, householdId));
}

export async function reconcileHouseholdMembersIfStale(
  deps: MembershipDeps,
  householdId: string,
  maxAgeMs: number,
): Promise<void> {
  const rows = await deps.db
    .select({ reconciledAt: household.membersReconciledAt })
    .from(household)
    .where(eq(household.id, householdId))
    .limit(1);
  const row = rows[0];
  if (!row) return;
  if (!isStale(row.reconciledAt, deps.now(), maxAgeMs)) return;
  await reconcileHouseholdMembers(deps, householdId);
}

export type EventOutcome = ProjectionOutcome | "tombstoned" | "ignored";

/** Applies one verified WorkOS event to the projection. Safe to call for duplicates and out of order. */
export async function applyHouseholdEvent(
  deps: MembershipDeps,
  event: HouseholdEvent,
): Promise<EventOutcome> {
  const { isDeletedIdentity } = await import("../deletion/service");
  switch (event.kind) {
    case "membership": {
      if (
        !event.deleted &&
        ((await isDeletedIdentity(deps.db, event.membership.userId, "user")) ||
          (await isDeletedIdentity(deps.db, event.membership.organizationId, "organization")))
      ) {
        return "ignored";
      }
      const observation = observationFromDirectory(event.membership, {
        status: event.deleted ? "inactive" : event.membership.status,
        observedAt: event.observedAt,
        eventId: event.eventId,
      });
      // A deletion for a User Trove never projected has nothing to tombstone.
      return event.deleted
        ? projectMembership(deps.db, observation)
        : projectWithUser(deps, observation);
    }
    case "organization_deleted":
      await tombstoneHousehold(deps.db, event.organizationId, event.observedAt);
      return "tombstoned";
    case "ignored":
      return "ignored";
  }
}

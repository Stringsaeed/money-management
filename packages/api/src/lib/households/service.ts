import { ORPCError } from "@orpc/server";
import { and, asc, eq } from "drizzle-orm";

import { decideWidgetToken } from "@trove/auth";
import type { DirectoryMembership } from "@trove/auth";
import { user } from "@trove/db/schema/auth";
import { household, membership } from "@trove/db/schema/household";
import { ledger } from "@trove/db/schema/ledger-scope";
import { type HouseholdRole, isHouseholdRole } from "@trove/protocol";

import { type CommandActor, ensureUserProjection } from "../commands/scope";
import { findActiveMembership } from "../membership/access";
import { projectMembership, tombstoneMembership } from "../membership/projection";
import {
  HOUSEHOLD_RECONCILE_MAX_AGE_MS,
  type MembershipDeps,
  USER_RECONCILE_MAX_AGE_MS,
  observationFromDirectory,
  reconcileHouseholdMembersIfStale,
  reconcileUserMembershipsIfStale,
} from "../membership/reconcile";
import { LAST_ADMIN_MESSAGE, canDropAdmin } from "./admin-guard";
import { consumeWidgetHandoff, issueWidgetHandoff } from "./widget-handoff";

export type HouseholdDeps = MembershipDeps;

/** Invitations expire after a week; the invitee accepts through AuthKit, never through Trove. */
export const INVITATION_EXPIRES_IN_DAYS = 7;

export interface HouseholdSummary {
  readonly householdId: string;
  readonly name: string;
  readonly role: HouseholdRole;
  readonly joinedAt: Date;
}

export interface HouseholdMember {
  readonly userId: string;
  readonly userName: string;
  readonly userEmail: string;
  readonly role: HouseholdRole;
  readonly joinedAt: Date;
}

export interface HouseholdDetail {
  readonly householdId: string;
  readonly name: string;
  readonly createdByUserId: string | null;
  readonly createdAt: Date;
  readonly members: readonly HouseholdMember[];
  /** True when no active admin remains; set only by widget-side mutations Trove could not prevent. */
  readonly adminless: boolean;
}

async function requireActive(deps: HouseholdDeps, userId: string, householdId: string) {
  const active = await findActiveMembership(deps.db, userId, householdId);
  if (!active) {
    throw new ORPCError("NOT_FOUND", { message: "You are not a member of this Household." });
  }
  return active;
}

async function requireAdmin(deps: HouseholdDeps, userId: string, householdId: string) {
  const active = await requireActive(deps, userId, householdId);
  if (active.role !== "admin") {
    throw new ORPCError("FORBIDDEN", { message: "Only a Household admin can do that." });
  }
  return active;
}

async function activeMembers(deps: HouseholdDeps, householdId: string) {
  return deps.db
    .select({ id: membership.id, userId: membership.userId, role: membership.role })
    .from(membership)
    .where(and(eq(membership.householdId, householdId), eq(membership.status, "active")));
}

async function project(deps: HouseholdDeps, row: DirectoryMembership): Promise<void> {
  await projectMembership(deps.db, observationFromDirectory(row));
}

/**
 * Creates a Household as a WorkOS Organization with the caller as its admin.
 *
 * `requestId` is the client's idempotency key. It scopes the WorkOS
 * idempotency key and the local `create_request_id`, so a retry after any
 * partial failure (organization made but rows not written, rows written but
 * membership not created) finishes the same Household instead of making a
 * second one. Nothing here runs from sign-in or personal sync.
 */
export async function createHousehold(
  deps: HouseholdDeps,
  input: { readonly actor: CommandActor; readonly name: string; readonly requestId: string },
): Promise<{ readonly householdId: string; readonly name: string }> {
  const { db, directory } = deps;
  const userId = input.actor.id;
  const name = input.name.trim();
  await ensureUserProjection(db, input.actor);

  const priorRows = await db
    .select({ id: household.id, name: household.name, createdByUserId: household.createdByUserId })
    .from(household)
    .where(eq(household.createRequestId, input.requestId))
    .limit(1);
  const prior = priorRows[0];
  if (prior && prior.createdByUserId !== userId) {
    throw new ORPCError("CONFLICT", { message: "This create request belongs to another User." });
  }

  const organizationId =
    prior?.id ??
    (await directory.createOrganization({ name, idempotencyKey: `${userId}:${input.requestId}` }))
      .id;

  await db.transaction(async (tx) => {
    await tx
      .insert(ledger)
      .values({ id: organizationId, kind: "organization", organizationId })
      .onConflictDoNothing();
    await tx
      .insert(household)
      .values({
        id: organizationId,
        name,
        createdByUserId: userId,
        createRequestId: input.requestId,
      })
      .onConflictDoNothing();
  });

  const admin = await ensureAdminMembership(deps, organizationId, userId);
  await project(deps, admin);
  return { householdId: organizationId, name: prior?.name ?? name };
}

async function ensureAdminMembership(
  deps: HouseholdDeps,
  organizationId: string,
  userId: string,
): Promise<DirectoryMembership> {
  const existing = (await deps.directory.listUserMemberships(userId)).find(
    (row) => row.organizationId === organizationId,
  );
  if (existing?.status === "active" && existing.roleSlug === "admin") return existing;
  if (existing?.status === "active") {
    return deps.directory.setMembershipRole(existing.id, "admin");
  }
  if (existing) {
    await deps.directory.deleteMembership(existing.id);
  }
  return deps.directory.createMembership({ organizationId, userId, roleSlug: "admin" });
}

export async function listMyHouseholds(
  deps: HouseholdDeps,
  actor: CommandActor,
): Promise<readonly HouseholdSummary[]> {
  await ensureUserProjection(deps.db, actor);
  await reconcileUserMembershipsIfStale(deps, actor.id, USER_RECONCILE_MAX_AGE_MS);
  const rows = await deps.db
    .select({
      householdId: household.id,
      name: household.name,
      role: membership.role,
      joinedAt: membership.createdAt,
    })
    .from(membership)
    .innerJoin(household, eq(household.id, membership.householdId))
    .where(and(eq(membership.userId, actor.id), eq(membership.status, "active")))
    .orderBy(asc(household.createdAt));
  return rows.flatMap((row) => (isHouseholdRole(row.role) ? [{ ...row, role: row.role }] : []));
}

export async function getHousehold(
  deps: HouseholdDeps,
  userId: string,
  householdId: string,
): Promise<HouseholdDetail> {
  await requireActive(deps, userId, householdId);
  await reconcileHouseholdMembersIfStale(deps, householdId, HOUSEHOLD_RECONCILE_MAX_AGE_MS);
  const rows = await deps.db.select().from(household).where(eq(household.id, householdId)).limit(1);
  const found = rows[0];
  if (!found) {
    throw new ORPCError("NOT_FOUND", { message: "Household not found." });
  }
  const members = await deps.db
    .select({
      userId: membership.userId,
      role: membership.role,
      joinedAt: membership.createdAt,
      userName: user.name,
      userEmail: user.email,
    })
    .from(membership)
    .innerJoin(user, eq(user.id, membership.userId))
    .where(and(eq(membership.householdId, householdId), eq(membership.status, "active")))
    .orderBy(asc(membership.createdAt));
  const known = members.flatMap((member) =>
    isHouseholdRole(member.role) ? [{ ...member, role: member.role }] : [],
  );
  return {
    householdId: found.id,
    name: found.name,
    createdByUserId: found.createdByUserId,
    createdAt: found.createdAt,
    members: known,
    adminless: !known.some((member) => member.role === "admin"),
  };
}

export async function renameHousehold(
  deps: HouseholdDeps,
  input: { readonly userId: string; readonly householdId: string; readonly name: string },
): Promise<void> {
  await requireAdmin(deps, input.userId, input.householdId);
  const name = input.name.trim();
  await deps.directory.renameOrganization(input.householdId, name);
  await deps.db.update(household).set({ name }).where(eq(household.id, input.householdId));
}

export async function inviteMember(
  deps: HouseholdDeps,
  input: {
    readonly userId: string;
    readonly householdId: string;
    readonly email: string;
    readonly role: HouseholdRole;
  },
): Promise<{ readonly invitationId: string; readonly expiresAt: Date }> {
  await requireAdmin(deps, input.userId, input.householdId);
  const invitation = await deps.directory.sendInvitation({
    email: input.email.trim().toLowerCase(),
    organizationId: input.householdId,
    inviterUserId: input.userId,
    roleSlug: input.role,
    expiresInDays: INVITATION_EXPIRES_IN_DAYS,
  });
  return { invitationId: invitation.id, expiresAt: invitation.expiresAt };
}

export async function setMemberRole(
  deps: HouseholdDeps,
  input: {
    readonly userId: string;
    readonly householdId: string;
    readonly targetUserId: string;
    readonly role: HouseholdRole;
  },
): Promise<void> {
  await requireAdmin(deps, input.userId, input.householdId);
  const members = await activeMembers(deps, input.householdId);
  const target = members.find((member) => member.userId === input.targetUserId);
  if (!target) {
    throw new ORPCError("NOT_FOUND", { message: "That User is not an active member." });
  }
  if (target.role === input.role) return;
  if (target.role === "admin" && !canDropAdmin(members, target.userId)) {
    throw new ORPCError("PRECONDITION_FAILED", { message: LAST_ADMIN_MESSAGE });
  }
  const updated = await deps.directory.setMembershipRole(target.id, input.role);
  await project(deps, updated);
}

async function removeMembership(
  deps: HouseholdDeps,
  householdId: string,
  targetUserId: string,
): Promise<void> {
  const members = await activeMembers(deps, householdId);
  const target = members.find((member) => member.userId === targetUserId);
  if (!target) {
    throw new ORPCError("NOT_FOUND", { message: "That User is not an active member." });
  }
  if (target.role === "admin" && !canDropAdmin(members, target.userId)) {
    throw new ORPCError("PRECONDITION_FAILED", { message: LAST_ADMIN_MESSAGE });
  }
  await deps.directory.deleteMembership(target.id);
  await tombstoneMembership(deps.db, target.id, deps.now());
}

export async function removeMember(
  deps: HouseholdDeps,
  input: { readonly userId: string; readonly householdId: string; readonly targetUserId: string },
): Promise<void> {
  await requireAdmin(deps, input.userId, input.householdId);
  await removeMembership(deps, input.householdId, input.targetUserId);
}

export async function leaveHousehold(
  deps: HouseholdDeps,
  input: { readonly userId: string; readonly householdId: string },
): Promise<void> {
  await requireActive(deps, input.userId, input.householdId);
  await removeMembership(deps, input.householdId, input.userId);
}

/**
 * Deletes the Organization and every row it owns. The organization Ledger
 * goes with it, so shared Accounts, Categories, and Transactions are removed;
 * members' Personal Ledgers are untouched.
 */
export async function deleteHousehold(
  deps: HouseholdDeps,
  input: { readonly userId: string; readonly householdId: string },
): Promise<void> {
  await requireAdmin(deps, input.userId, input.householdId);
  await deps.directory.deleteOrganization(input.householdId);
  await deps.db.transaction(async (tx) => {
    await tx.delete(household).where(eq(household.id, input.householdId));
    await tx.delete(ledger).where(eq(ledger.id, input.householdId));
  });
}

/**
 * Starts the browser handoff for the member-management page. Only an active
 * admin gets a code; the code is single-use, expires quickly, and is not a
 * credential by itself — the page exchanges it server-side for a widget token
 * bound to this User and Organization.
 */
export async function startWidgetHandoff(
  deps: HouseholdDeps,
  input: { readonly userId: string; readonly householdId: string },
): Promise<{ readonly code: string; readonly expiresAt: Date }> {
  const active = await requireActive(deps, input.userId, input.householdId);
  const decision = decideWidgetToken({
    userId: input.userId,
    organizationId: input.householdId,
    role: active.role,
  });
  if (decision.kind === "deny") {
    throw new ORPCError("FORBIDDEN", {
      message: "Only a Household admin can manage members.",
    });
  }
  return issueWidgetHandoff(deps.db, {
    userId: decision.userId,
    organizationId: decision.organizationId,
    now: deps.now(),
  });
}

export interface WidgetSession {
  readonly token: string;
  readonly organizationId: string;
  readonly householdName: string;
}

/** Exchanges a handoff code for a widget token, re-checking the admin role at exchange time. */
export async function exchangeWidgetHandoff(
  deps: HouseholdDeps,
  code: string,
): Promise<WidgetSession | null> {
  const consumed = await consumeWidgetHandoff(deps.db, code, deps.now());
  if (!consumed) return null;
  const active = await findActiveMembership(deps.db, consumed.userId, consumed.organizationId);
  if (active?.role !== "admin") return null;
  const minted = await deps.directory.mintWidgetToken({
    userId: consumed.userId,
    organizationId: consumed.organizationId,
  });
  return {
    token: minted.token,
    organizationId: consumed.organizationId,
    householdName: consumed.householdName,
  };
}

import { and, asc, eq, sql } from "drizzle-orm";
import type { DirectoryMembership, HouseholdDirectory } from "@trove/auth";
import {
  v2Household,
  v2HouseholdMember,
  v2Identity,
  type V2HouseholdMemberStatus,
  type V2HouseholdRole,
} from "@trove/db/schema/v2-identity";

import {
  ensureV2UserIdentity,
  V2AuthError,
  type V2Database,
  type V2DbExecutor,
  type V2UserPrincipal,
} from "./auth";

export interface V2HouseholdDeps {
  readonly db: V2Database;
  readonly directory: HouseholdDirectory;
  readonly now?: () => Date;
}

export interface V2HouseholdSummary {
  readonly householdId: string;
  readonly name: string;
  readonly role: V2HouseholdRole;
  readonly joinedAt: Date;
}

export interface V2HouseholdMember {
  readonly membershipId: string;
  readonly userId: string;
  readonly userName: string;
  readonly userEmail: string;
  readonly role: V2HouseholdRole;
  readonly status: V2HouseholdMemberStatus;
  readonly joinedAt: Date;
}

export interface V2HouseholdDetail extends V2HouseholdSummary {
  readonly createdByUserId: string;
  readonly members: readonly V2HouseholdMember[];
}

function nowOf(deps: V2HouseholdDeps): Date {
  return deps.now?.() ?? new Date();
}

function role(value: string): V2HouseholdRole {
  if (value === "admin" || value === "member" || value === "viewer") return value;
  throw new V2AuthError({
    status: 403,
    code: "unknown_household_role",
    message: "This household membership has an unsupported role.",
  });
}

function status(value: string): V2HouseholdMemberStatus {
  if (value === "active" || value === "inactive" || value === "pending") return value;
  return "inactive";
}

async function requireMember(
  deps: V2HouseholdDeps,
  userId: string,
  householdId: string,
): Promise<{ readonly membershipId: string; readonly role: V2HouseholdRole }> {
  await requireKnownV2Household(deps, householdId);
  await reconcileUserMemberships(deps, userId);
  const live = await deps.directory.listOrganizationMemberships(householdId);
  const found = live.find(
    (membership) => membership.userId === userId && membership.status === "active",
  );
  if (!found) {
    await deps.db
      .update(v2HouseholdMember)
      .set({ status: "inactive", updatedAt: nowOf(deps) })
      .where(
        and(eq(v2HouseholdMember.householdId, householdId), eq(v2HouseholdMember.userId, userId)),
      );
    throw new V2AuthError({
      status: 403,
      code: "household_membership_required",
      message: "You are not an active member of this household.",
    });
  }
  const liveRole = role(found.roleSlug);
  const projected = await deps.db
    .select({ id: v2HouseholdMember.id })
    .from(v2HouseholdMember)
    .where(
      and(
        eq(v2HouseholdMember.householdId, householdId),
        eq(v2HouseholdMember.userId, userId),
        eq(v2HouseholdMember.status, "active"),
      ),
    )
    .limit(1);
  if (!projected[0]) {
    throw new V2AuthError({
      status: 409,
      code: "household_membership_conflict",
      message: "Another household is currently selected for this account.",
    });
  }
  return { membershipId: found.id, role: liveRole };
}

async function requireKnownV2Household(deps: V2HouseholdDeps, householdId: string): Promise<void> {
  const known = await deps.db
    .select({ id: v2Household.id })
    .from(v2Household)
    .where(eq(v2Household.id, householdId))
    .limit(1);
  if (!known[0]) {
    throw new V2AuthError({
      status: 404,
      code: "household_not_found",
      message: "Household not found.",
    });
  }
}

async function requireAdmin(deps: V2HouseholdDeps, userId: string, householdId: string) {
  const member = await requireMember(deps, userId, householdId);
  if (member.role !== "admin") {
    throw new V2AuthError({
      status: 403,
      code: "household_admin_required",
      message: "Only a household admin can do that.",
    });
  }
  return member;
}

async function upsertIdentity(
  deps: V2HouseholdDeps,
  user: { readonly id: string; readonly email?: string; readonly name?: string | null },
): Promise<void> {
  await ensureV2UserIdentity(deps.db, {
    kind: "user",
    userId: user.id,
    workosUserId: user.id,
    email: user.email ?? "",
    name: user.name ?? user.email ?? user.id,
  });
}

async function projectMembershipInto(
  deps: V2HouseholdDeps,
  db: V2DbExecutor,
  householdId: string,
  membership: DirectoryMembership,
  forcedStatus?: V2HouseholdMemberStatus,
): Promise<void> {
  const existingHousehold = await db
    .select({ id: v2Household.id })
    .from(v2Household)
    .where(eq(v2Household.id, householdId))
    .limit(1);
  if (!existingHousehold[0] || existingHousehold[0].id !== membership.organizationId) return;

  const directoryUser = await deps.directory.getUser(membership.userId);
  if (!directoryUser) return;
  await ensureV2UserIdentity(db, {
    kind: "user",
    userId: membership.userId,
    workosUserId: membership.userId,
    email: directoryUser.email,
    name: directoryUser.name ?? directoryUser.email ?? membership.userId,
  });
  const observedAt = membership.updatedAt;
  const conflictingActive = await db
    .select({ id: v2HouseholdMember.id })
    .from(v2HouseholdMember)
    .where(
      and(
        eq(v2HouseholdMember.userId, membership.userId),
        eq(v2HouseholdMember.status, "active"),
        sql`${v2HouseholdMember.householdId} <> ${householdId}`,
      ),
    )
    .limit(1);
  const projectedStatus =
    forcedStatus ??
    (membership.status === "active" && conflictingActive[0]
      ? "pending"
      : status(membership.status));
  await db
    .insert(v2HouseholdMember)
    .values({
      id: membership.id,
      householdId,
      userId: membership.userId,
      role: role(membership.roleSlug),
      status: projectedStatus,
      observedAt,
      createdAt: membership.createdAt,
      updatedAt: observedAt,
    })
    .onConflictDoUpdate({
      target: [v2HouseholdMember.householdId, v2HouseholdMember.userId],
      set: {
        id: membership.id,
        householdId,
        userId: membership.userId,
        role: role(membership.roleSlug),
        status: projectedStatus,
        observedAt,
        updatedAt: nowOf(deps),
      },
    });
}

async function reconcileHouseholdMembers(
  deps: V2HouseholdDeps,
  householdId: string,
): Promise<void> {
  const rows = await deps.directory.listOrganizationMemberships(householdId);
  // Fail closed before applying the live result. If WorkOS says a previously
  // projected membership no longer exists, the cached row must not continue
  // granting access after this request.
  await deps.db.transaction(async (tx) => {
    await tx
      .update(v2HouseholdMember)
      .set({ status: "inactive", updatedAt: nowOf(deps) })
      .where(
        and(eq(v2HouseholdMember.householdId, householdId), eq(v2HouseholdMember.status, "active")),
      );
    for (const membership of rows) {
      await projectMembershipInto(deps, tx, householdId, membership);
    }
  });
}

async function reconcileUserMemberships(deps: V2HouseholdDeps, userId: string): Promise<void> {
  const rows = await deps.directory.listUserMemberships(userId);
  const knownRows = await deps.db.select({ id: v2Household.id }).from(v2Household);
  const known = new Set(knownRows.map((row) => row.id));
  const candidates = rows
    .filter((membership) => membership.status === "active" && known.has(membership.organizationId))
    .filter(
      (membership) =>
        membership.roleSlug === "admin" ||
        membership.roleSlug === "member" ||
        membership.roleSlug === "viewer",
    )
    .sort((left, right) => left.organizationId.localeCompare(right.organizationId));
  await deps.db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${`v2-user:${userId}`}))`);
    const existingActive = await tx
      .select({ householdId: v2HouseholdMember.householdId })
      .from(v2HouseholdMember)
      .where(and(eq(v2HouseholdMember.userId, userId), eq(v2HouseholdMember.status, "active")));
    const existingActiveIds = new Set(existingActive.map((row) => row.householdId));
    const preferred =
      candidates.find((membership) => existingActiveIds.has(membership.organizationId)) ??
      candidates[0];
    await tx
      .update(v2HouseholdMember)
      .set({ status: "inactive", updatedAt: nowOf(deps) })
      .where(and(eq(v2HouseholdMember.userId, userId), eq(v2HouseholdMember.status, "active")));
    for (const membership of candidates) {
      await projectMembershipInto(
        deps,
        tx,
        membership.organizationId,
        membership,
        preferred?.organizationId === membership.organizationId ? "active" : "pending",
      );
    }
  });
}

export async function createV2Household(
  deps: V2HouseholdDeps,
  input: { readonly actor: V2UserPrincipal; readonly name: string; readonly requestId: string },
): Promise<{ readonly householdId: string; readonly name: string }> {
  const name = input.name.trim();
  if (!name)
    throw new V2AuthError({ status: 400, code: "invalid_name", message: "Name is required." });
  const priorRows = await deps.db
    .select({
      id: v2Household.id,
      name: v2Household.name,
      createdByUserId: v2Household.createdByUserId,
    })
    .from(v2Household)
    .where(eq(v2Household.createRequestId, input.requestId))
    .limit(1);
  const prior = priorRows[0];
  if (prior) {
    if (prior.createdByUserId !== input.actor.userId) {
      throw new V2AuthError({
        status: 409,
        code: "create_request_owned",
        message: "This create request belongs to another account.",
      });
    }
    return { householdId: prior.id, name: prior.name };
  }
  const active = await deps.db
    .select({ householdId: v2HouseholdMember.householdId })
    .from(v2HouseholdMember)
    .where(
      and(eq(v2HouseholdMember.userId, input.actor.userId), eq(v2HouseholdMember.status, "active")),
    )
    .limit(1);
  if (active[0]) {
    throw new V2AuthError({
      status: 409,
      code: "active_household_exists",
      message: "Leave your current household before creating another one.",
    });
  }

  await upsertIdentity(deps, {
    id: input.actor.userId,
    email: input.actor.email,
    name: input.actor.name,
  });
  const organization = await deps.directory.createOrganization({
    name,
    idempotencyKey: `v2:${input.actor.userId}:${input.requestId}`,
  });
  const existingMembership = (await deps.directory.listUserMemberships(input.actor.userId)).find(
    (membership) => membership.organizationId === organization.id,
  );
  const membership = existingMembership
    ? existingMembership.roleSlug === "admin" && existingMembership.status === "active"
      ? existingMembership
      : await deps.directory.setMembershipRole(existingMembership.id, "admin")
    : await deps.directory.createMembership({
        organizationId: organization.id,
        userId: input.actor.userId,
        roleSlug: "admin",
      });
  const now = nowOf(deps);
  await deps.db.transaction(async (tx) => {
    await tx
      .insert(v2Household)
      .values({
        id: organization.id,
        workosOrganizationId: organization.id,
        name: organization.name,
        createdByUserId: input.actor.userId,
        createRequestId: input.requestId,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing();
    await tx
      .insert(v2HouseholdMember)
      .values({
        id: membership.id,
        householdId: organization.id,
        userId: input.actor.userId,
        role: "admin",
        status: "active",
        observedAt: membership.updatedAt,
        createdAt: membership.createdAt,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [v2HouseholdMember.householdId, v2HouseholdMember.userId],
        set: {
          id: membership.id,
          role: "admin",
          status: "active",
          observedAt: membership.updatedAt,
          updatedAt: now,
        },
      });
  });
  const persisted = await deps.db
    .select({
      id: v2Household.id,
      name: v2Household.name,
      createdByUserId: v2Household.createdByUserId,
    })
    .from(v2Household)
    .where(eq(v2Household.id, organization.id))
    .limit(1);
  const saved = persisted[0];
  if (!saved || saved.createdByUserId !== input.actor.userId) {
    throw new V2AuthError({
      status: 409,
      code: "household_exists",
      message: "This household already belongs to another account.",
    });
  }
  return { householdId: saved.id, name: saved.name };
}

export async function listV2Households(
  deps: V2HouseholdDeps,
  user: V2UserPrincipal,
): Promise<readonly V2HouseholdSummary[]> {
  await upsertIdentity(deps, { id: user.userId, email: user.email, name: user.name });
  await reconcileUserMemberships(deps, user.userId);
  const rows = await deps.db
    .select({
      householdId: v2Household.id,
      name: v2Household.name,
      role: v2HouseholdMember.role,
      joinedAt: v2HouseholdMember.createdAt,
    })
    .from(v2HouseholdMember)
    .innerJoin(v2Household, eq(v2Household.id, v2HouseholdMember.householdId))
    .where(and(eq(v2HouseholdMember.userId, user.userId), eq(v2HouseholdMember.status, "active")))
    .orderBy(asc(v2Household.createdAt));
  return rows.map((row) => ({ ...row, role: role(row.role) }));
}

export async function getV2Household(
  deps: V2HouseholdDeps,
  input: { readonly userId: string; readonly householdId: string },
): Promise<V2HouseholdDetail> {
  await requireMember(deps, input.userId, input.householdId);
  await reconcileHouseholdMembers(deps, input.householdId);
  const householdRows = await deps.db
    .select({
      householdId: v2Household.id,
      name: v2Household.name,
      createdByUserId: v2Household.createdByUserId,
      role: v2HouseholdMember.role,
      joinedAt: v2HouseholdMember.createdAt,
    })
    .from(v2HouseholdMember)
    .innerJoin(v2Household, eq(v2Household.id, v2HouseholdMember.householdId))
    .where(and(eq(v2HouseholdMember.userId, input.userId), eq(v2Household.id, input.householdId)))
    .limit(1);
  const found = householdRows[0];
  if (!found)
    throw new V2AuthError({
      status: 404,
      code: "household_not_found",
      message: "Household not found.",
    });
  const members = await deps.db
    .select({
      membershipId: v2HouseholdMember.id,
      userId: v2HouseholdMember.userId,
      userName: v2Identity.name,
      userEmail: v2Identity.email,
      role: v2HouseholdMember.role,
      status: v2HouseholdMember.status,
      joinedAt: v2HouseholdMember.createdAt,
    })
    .from(v2HouseholdMember)
    .innerJoin(v2Identity, eq(v2Identity.id, v2HouseholdMember.userId))
    .where(eq(v2HouseholdMember.householdId, input.householdId))
    .orderBy(asc(v2HouseholdMember.createdAt));
  return {
    householdId: found.householdId,
    name: found.name,
    role: role(found.role),
    joinedAt: found.joinedAt,
    createdByUserId: found.createdByUserId,
    members: members.map((member) => ({
      ...member,
      role: role(member.role),
      status: status(member.status),
    })),
  };
}

export async function inviteV2Member(
  deps: V2HouseholdDeps,
  input: {
    readonly userId: string;
    readonly householdId: string;
    readonly email: string;
    readonly role: V2HouseholdRole;
  },
): Promise<{ readonly invitationId: string; readonly expiresAt: Date }> {
  await requireAdmin(deps, input.userId, input.householdId);
  const invitation = await deps.directory.sendInvitation({
    email: input.email.trim().toLowerCase(),
    organizationId: input.householdId,
    inviterUserId: input.userId,
    roleSlug: input.role,
    expiresInDays: 7,
  });
  return { invitationId: invitation.id, expiresAt: invitation.expiresAt };
}

export async function leaveV2Household(
  deps: V2HouseholdDeps,
  input: { readonly userId: string; readonly householdId: string },
): Promise<void> {
  await requireMember(deps, input.userId, input.householdId);
  await deps.db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext(${`v2-household:${input.householdId}`}))`,
    );
    const live = await deps.directory.listOrganizationMemberships(input.householdId);
    const current = live.find(
      (membership) => membership.userId === input.userId && membership.status === "active",
    );
    if (!current)
      throw new V2AuthError({
        status: 403,
        code: "household_membership_required",
        message: "You are not an active member of this household.",
      });
    const currentRole = role(current.roleSlug);
    if (currentRole === "admin") {
      const admins = live.filter(
        (membership) => membership.status === "active" && membership.roleSlug === "admin",
      );
      if (admins.length <= 1)
        throw new V2AuthError({
          status: 409,
          code: "last_admin",
          message: "Assign another admin before leaving this household.",
        });
    }
    await deps.directory.deleteMembership(current.id);
    await tx
      .update(v2HouseholdMember)
      .set({ status: "inactive", updatedAt: nowOf(deps) })
      .where(
        and(
          eq(v2HouseholdMember.householdId, input.householdId),
          eq(v2HouseholdMember.userId, input.userId),
        ),
      );
  });
}

export async function setV2MemberRole(
  deps: V2HouseholdDeps,
  input: {
    readonly userId: string;
    readonly householdId: string;
    readonly targetUserId: string;
    readonly role: V2HouseholdRole;
  },
): Promise<void> {
  await requireAdmin(deps, input.userId, input.householdId);
  await deps.db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext(${`v2-household:${input.householdId}`}))`,
    );
    const live = await deps.directory.listOrganizationMemberships(input.householdId);
    const actor = live.find(
      (membership) => membership.userId === input.userId && membership.status === "active",
    );
    if (!actor || role(actor.roleSlug) !== "admin")
      throw new V2AuthError({
        status: 403,
        code: "household_admin_required",
        message: "Only a household admin can do that.",
      });
    const target = live.find(
      (membership) => membership.userId === input.targetUserId && membership.status === "active",
    );
    if (!target)
      throw new V2AuthError({
        status: 404,
        code: "member_not_found",
        message: "Active member not found.",
      });
    const targetRole = role(target.roleSlug);
    if (targetRole === input.role) return;
    if (targetRole === "admin" && input.role !== "admin") {
      const admins = live.filter(
        (membership) => membership.status === "active" && membership.roleSlug === "admin",
      );
      if (admins.length <= 1)
        throw new V2AuthError({
          status: 409,
          code: "last_admin",
          message: "A household must keep an admin.",
        });
    }
    await deps.directory.setMembershipRole(target.id, input.role);
    await tx
      .update(v2HouseholdMember)
      .set({ role: input.role, updatedAt: nowOf(deps) })
      .where(
        and(
          eq(v2HouseholdMember.householdId, input.householdId),
          eq(v2HouseholdMember.userId, input.targetUserId),
        ),
      );
  });
}

/**
 * Live authorization seam for V2 ledger routes. WorkOS membership state is
 * reconciled before the local projection is trusted, and viewers are denied
 * whenever a mutation asks for write access.
 */
export async function authorizeV2Household(
  deps: V2HouseholdDeps,
  input: { readonly userId: string; readonly householdId: string; readonly write?: boolean },
): Promise<{ readonly membershipId: string; readonly role: V2HouseholdRole }> {
  const member = await requireMember(deps, input.userId, input.householdId);
  if (input.write && member.role === "viewer") {
    throw new V2AuthError({
      status: 403,
      code: "household_write_required",
      message: "Viewer membership cannot change household data.",
    });
  }
  return member;
}

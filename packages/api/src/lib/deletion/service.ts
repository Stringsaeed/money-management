import { randomUUID } from "node:crypto";

import { ORPCError } from "@orpc/server";
import { and, eq } from "drizzle-orm";

import { user } from "@trove/db/schema/auth";
import { deletedIdentity, deletionOperation } from "@trove/db/schema/deletion";
import { household, membership } from "@trove/db/schema/household";
import { ledger } from "@trove/db/schema/ledger-scope";
import { personalLedgerId } from "@trove/protocol";

import type { CommandDatabase } from "../commands/types";
import { assertUserDeletionAllowed } from "../households/sole-admin-deletion-guard";
import { tombstoneMembership } from "../membership/projection";
import type { MembershipDeps } from "../membership/reconcile";

export type DeletionDeps = MembershipDeps;

const HOUSEHOLD_STEPS = [
  "tombstone_identity",
  "delete_workos_org",
  "delete_local_household",
] as const;

const USER_STEPS = [
  "guard_sole_admin",
  "tombstone_identity",
  "anonymize_user",
  "delete_personal_ledger",
  "revoke_memberships",
  "clear_credentials",
  "delete_workos_user",
] as const;

export async function isDeletedIdentity(
  db: CommandDatabase,
  id: string,
  kind: "user" | "organization",
): Promise<boolean> {
  const rows = await db
    .select({ id: deletedIdentity.id })
    .from(deletedIdentity)
    .where(and(eq(deletedIdentity.id, id), eq(deletedIdentity.kind, kind)))
    .limit(1);
  return rows.length > 0;
}

async function recordDeletedIdentity(
  db: CommandDatabase,
  id: string,
  kind: "user" | "organization",
): Promise<void> {
  await db
    .insert(deletedIdentity)
    .values({ id, kind, reason: "user_request" })
    .onConflictDoNothing();
}

async function upsertOperation(
  db: CommandDatabase,
  input: {
    readonly id: string;
    readonly kind: "user" | "household";
    readonly targetId: string;
    readonly requestedByUserId: string;
    readonly payload?: Record<string, unknown>;
  },
): Promise<string> {
  const existing = await db
    .select({ id: deletionOperation.id })
    .from(deletionOperation)
    .where(
      and(eq(deletionOperation.kind, input.kind), eq(deletionOperation.targetId, input.targetId)),
    )
    .limit(1);
  if (existing[0]) return existing[0].id;
  await db.insert(deletionOperation).values({
    id: input.id,
    kind: input.kind,
    targetId: input.targetId,
    requestedByUserId: input.requestedByUserId,
    payload: input.payload ?? {},
  });
  return input.id;
}

/**
 * Advances a durable deletion from its stored cursor. Steps are idempotent so
 * retries after WorkOS or DB failures converge without duplicate destruction.
 */
export async function advanceDeletionOperation(
  deps: DeletionDeps,
  operationId: string,
): Promise<{ readonly status: "succeeded" | "failed" }> {
  const rows = await deps.db
    .select()
    .from(deletionOperation)
    .where(eq(deletionOperation.id, operationId))
    .limit(1);
  const operation = rows[0];
  if (!operation) {
    throw new ORPCError("NOT_FOUND", { message: "Deletion operation not found." });
  }
  if (operation.status === "succeeded") return { status: "succeeded" };

  await deps.db
    .update(deletionOperation)
    .set({ status: "running", attempts: operation.attempts + 1, lastError: null })
    .where(eq(deletionOperation.id, operation.id));

  const stepCount = operation.kind === "household" ? HOUSEHOLD_STEPS.length : USER_STEPS.length;
  let cursor = operation.cursor;

  try {
    while (cursor < stepCount) {
      if (operation.kind === "household") {
        await runHouseholdStep(deps, operation.targetId, HOUSEHOLD_STEPS[cursor]!);
      } else {
        await runUserStep(deps, operation.targetId, USER_STEPS[cursor]!);
      }
      cursor += 1;
      await deps.db
        .update(deletionOperation)
        .set({ cursor })
        .where(eq(deletionOperation.id, operation.id));
    }
    await deps.db
      .update(deletionOperation)
      .set({ status: "succeeded", cursor, lastError: null })
      .where(eq(deletionOperation.id, operation.id));
    return { status: "succeeded" };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await deps.db
      .update(deletionOperation)
      .set({ status: "failed", lastError: message })
      .where(eq(deletionOperation.id, operation.id));
    throw error;
  }
}

async function runHouseholdStep(
  deps: DeletionDeps,
  householdId: string,
  step: (typeof HOUSEHOLD_STEPS)[number],
): Promise<void> {
  switch (step) {
    case "tombstone_identity":
      await recordDeletedIdentity(deps.db, householdId, "organization");
      return;
    case "delete_workos_org":
      await deps.directory.deleteOrganization(householdId);
      return;
    case "delete_local_household":
      await deps.db.transaction(async (tx) => {
        await tx.delete(household).where(eq(household.id, householdId));
        await tx.delete(ledger).where(eq(ledger.id, householdId));
      });
  }
}

async function runUserStep(
  deps: DeletionDeps,
  userId: string,
  step: (typeof USER_STEPS)[number],
): Promise<void> {
  switch (step) {
    case "guard_sole_admin":
      await assertUserDeletionAllowed(deps.db, userId);
      return;
    case "tombstone_identity":
      await recordDeletedIdentity(deps.db, userId, "user");
      return;
    case "anonymize_user": {
      const stamp = userId.replace(/[^a-zA-Z0-9]/g, "").slice(-12) || "user";
      await deps.db
        .update(user)
        .set({
          name: "Deleted User",
          email: `deleted+${stamp}@invalid.trove`,
          emailVerified: false,
          image: null,
          membershipsReconciledAt: null,
        })
        .where(eq(user.id, userId));
      return;
    }
    case "delete_personal_ledger":
      await deps.db.delete(ledger).where(eq(ledger.id, personalLedgerId(userId)));
      return;
    case "revoke_memberships": {
      const rows = await deps.db
        .select({ id: membership.id, status: membership.status })
        .from(membership)
        .where(eq(membership.userId, userId));
      for (const row of rows) {
        try {
          await deps.directory.deleteMembership(row.id);
        } catch {
          // Prior attempt may already have removed the WorkOS membership.
        }
        if (row.status === "active" || row.status === "pending") {
          await tombstoneMembership(deps.db, row.id, deps.now());
        }
      }
      return;
    }
    case "clear_credentials":
      // Better Auth session/account tables removed (#231); step kept for in-flight ops.
      return;
    case "delete_workos_user":
      await deps.directory.deleteUser(userId);
  }
}

/**
 * Admin-only Household deletion. `confirmName` must equal the Household name so
 * callers explicitly acknowledge that shared data is removed for every member.
 */
export async function requestHouseholdDeletion(
  deps: DeletionDeps,
  input: {
    readonly userId: string;
    readonly householdId: string;
    readonly confirmName: string;
  },
): Promise<{ readonly operationId: string }> {
  if (await isDeletedIdentity(deps.db, input.householdId, "organization")) {
    return { operationId: `household:${input.householdId}` };
  }

  const active = await deps.db
    .select({ role: membership.role })
    .from(membership)
    .where(
      and(
        eq(membership.householdId, input.householdId),
        eq(membership.userId, input.userId),
        eq(membership.status, "active"),
      ),
    )
    .limit(1);
  if (!active[0]) {
    throw new ORPCError("NOT_FOUND", { message: "You are not a member of this Household." });
  }
  if (active[0].role !== "admin") {
    throw new ORPCError("FORBIDDEN", { message: "Only a Household admin can do that." });
  }

  const rows = await deps.db
    .select({ name: household.name })
    .from(household)
    .where(eq(household.id, input.householdId))
    .limit(1);
  const found = rows[0];
  if (!found) {
    throw new ORPCError("NOT_FOUND", { message: "Household not found." });
  }
  if (input.confirmName.trim() !== found.name) {
    throw new ORPCError("BAD_REQUEST", {
      message:
        "Confirmation does not match the Household name. Shared data for every member will be removed.",
    });
  }

  const operationId = await upsertOperation(deps.db, {
    id: `household:${input.householdId}`,
    kind: "household",
    targetId: input.householdId,
    requestedByUserId: input.userId,
    payload: { confirmName: found.name },
  });
  await advanceDeletionOperation(deps, operationId);
  return { operationId };
}

/**
 * Deletes the caller's identity and personal cloud data while preserving shared
 * Household rows under anonymized attribution.
 */
export async function requestUserDeletion(
  deps: DeletionDeps,
  input: { readonly userId: string },
): Promise<{ readonly operationId: string }> {
  if (await isDeletedIdentity(deps.db, input.userId, "user")) {
    return { operationId: `user:${input.userId}` };
  }

  try {
    await assertUserDeletionAllowed(deps.db, input.userId);
  } catch (error) {
    const sole =
      error instanceof Error &&
      "code" in error &&
      (error as { code?: string }).code === "SOLE_ADMIN";
    if (sole) {
      throw new ORPCError("PRECONDITION_FAILED", {
        message:
          error instanceof Error
            ? error.message
            : "Appoint another admin or delete the Household before deleting this User.",
      });
    }
    throw error;
  }

  const operationId = await upsertOperation(deps.db, {
    id: `user:${input.userId}`,
    kind: "user",
    targetId: input.userId,
    requestedByUserId: input.userId,
  });
  await advanceDeletionOperation(deps, operationId);
  return { operationId };
}

/** Stable id helper for tests that need a distinct pending operation row. */
export function newDeletionOperationId(kind: "user" | "household", targetId: string): string {
  return `${kind}:${targetId}:${randomUUID()}`;
}

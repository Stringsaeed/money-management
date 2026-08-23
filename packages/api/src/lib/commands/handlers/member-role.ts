import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { validateMemberRoleChange } from "@trove/domain/member-role-change";
import { membership } from "@trove/db/schema/household";
import { HOUSEHOLD_ROLES, type HouseholdRole } from "@trove/protocol";

import type { CommandPlan, PlanContext, PlanRejection, PlanRequest } from "../pipeline";
import type { BatchStatement } from "../statements";

import { issuesFromZod } from "./shared";

const memberRoleChangePayloadSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(HOUSEHOLD_ROLES),
});

export const memberRoleChangeHandler = {
  parsePayload(payload: unknown) {
    const result = memberRoleChangePayloadSchema.safeParse(payload);
    return result.success
      ? { ok: true as const, value: result.data }
      : { ok: false as const, issues: issuesFromZod(result.error) };
  },

  async plan(
    ctx: PlanContext,
    { payload, preconditions }: PlanRequest,
  ): Promise<CommandPlan | PlanRejection> {
    const input = payload as { userId: string; role: HouseholdRole };

    const targetRows = await ctx.db
      .select()
      .from(membership)
      .where(and(eq(membership.userId, input.userId), eq(membership.householdId, ctx.householdId)))
      .limit(1);
    const target = targetRows[0];
    if (!target) {
      return { kind: "missing_entity", entityType: "membership", entityId: input.userId };
    }

    const issues = validateMemberRoleChange({
      actorRole: ctx.actorRole,
      targetCurrentRole: target.role as HouseholdRole,
      nextRole: input.role,
      sameUser: ctx.actorUserId === input.userId,
    });
    if (issues.length > 0) {
      return { kind: "invalid_intent", issues };
    }

    // Optimistic-concurrency precondition on the target membership's version.
    const expectedVersion = preconditions.find(
      (p) =>
        p.expectedVersion !== undefined &&
        (!p.entityId || p.entityId === target.id || p.entityId === target.userId),
    )?.expectedVersion;
    if (expectedVersion !== undefined && expectedVersion !== target.version) {
      return {
        kind: "stale_version",
        entityId: target.id,
        expectedVersion,
        actualVersion: target.version,
      };
    }
    const guardVersion = expectedVersion ?? target.version;

    const rowGuard = and(
      eq(membership.id, target.id),
      eq(membership.householdId, ctx.householdId),
      eq(membership.version, guardVersion),
    );

    return {
      effects: ["members"],
      applied: {
        membershipId: target.id,
        userId: target.userId,
        previousRole: target.role,
        role: input.role,
      },
      guards: [sql`(SELECT COUNT(*) FROM ${membership} WHERE ${rowGuard}) = 1`],
      statements: [
        // Guarded write: the version predicate rides in the WHERE clause, so
        // even without the assertion the update cannot hit a stale row.
        ctx.db
          .update(membership)
          .set({ role: input.role, version: sql`${membership.version} + 1` })
          .where(rowGuard) as unknown as BatchStatement,
      ],
    };
  },
};

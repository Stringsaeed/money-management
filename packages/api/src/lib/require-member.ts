import { and, eq } from "drizzle-orm";
import { ORPCError } from "@orpc/server";

import { membership } from "@trove/db/schema/household";

import type { CommandDatabase } from "./commands/types";

/**
 * Household tenancy gate shared by budget-domain reads. D1 has no RLS and no
 * DB-level backstop — this check is what keeps one household out of another's
 * data, so every entry point must run it before any scoped read.
 *
 * Any member role may pass, including `viewer`: reads are allowed, writes are
 * separately gated by the command capability map (`can(role, kind)`).
 */
export async function requireHouseholdMember(
  db: CommandDatabase,
  userId: string,
  householdId: string,
): Promise<void> {
  const rows = await db
    .select({ id: membership.id })
    .from(membership)
    .where(and(eq(membership.userId, userId), eq(membership.householdId, householdId)))
    .limit(1);
  if (!rows[0]) {
    throw new ORPCError("FORBIDDEN", {
      message: "You are not a member of this household.",
    });
  }
}

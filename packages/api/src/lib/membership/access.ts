import { and, eq } from "drizzle-orm";

import { membership } from "@trove/db/schema/household";
import { type HouseholdRole, isHouseholdRole } from "@trove/protocol";

import type { CommandDatabase } from "../commands/types";

export interface ActiveMembership {
  readonly id: string;
  readonly role: HouseholdRole;
}

/**
 * The one read every Household authorization goes through. A Membership grants
 * access only when its projection is `active` and its role slug is one Trove
 * knows; unknown, pending, inactive, or missing memberships all deny.
 */
export async function findActiveMembership(
  db: CommandDatabase,
  userId: string,
  householdId: string,
): Promise<ActiveMembership | null> {
  const rows = await db
    .select({ id: membership.id, role: membership.role, status: membership.status })
    .from(membership)
    .where(and(eq(membership.userId, userId), eq(membership.householdId, householdId)))
    .limit(1);
  const row = rows[0];
  if (!row || row.status !== "active" || !isHouseholdRole(row.role)) {
    return null;
  }
  return { id: row.id, role: row.role };
}

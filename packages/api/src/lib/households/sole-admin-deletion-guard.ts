import { eq } from "drizzle-orm";

import { membership } from "@trove/db/schema/household";

import type { CommandDatabase } from "../commands/types";
import { canDropAdmin, LAST_ADMIN_MESSAGE } from "./admin-guard";

export { LAST_ADMIN_MESSAGE };

export interface SoleAdminHousehold {
  readonly householdId: string;
  readonly name?: string;
}

/**
 * App-owned User-deletion prerequisite (#224 / #228).
 *
 * WorkOS does not promise a last-admin invariant for customer organizations.
 * Before deleting a User's identity, Trove must refuse when that User is the
 * sole active admin of any Household they still belong to. The caller must
 * appoint another admin or delete those Households first.
 *
 * This guard is prevention at the Trove boundary. It does not claim that
 * widget-side demotions are impossible; those are reported as
 * `adminless` on Household detail after the fact.
 */
export async function listSoleAdminHouseholds(
  db: CommandDatabase,
  userId: string,
): Promise<readonly SoleAdminHousehold[]> {
  const rows = await db
    .select({
      householdId: membership.householdId,
      userId: membership.userId,
      role: membership.role,
      status: membership.status,
    })
    .from(membership)
    .where(eq(membership.status, "active"));

  const byHousehold = new Map<string, { userId: string; role: string }[]>();
  for (const row of rows) {
    const list = byHousehold.get(row.householdId) ?? [];
    list.push({ userId: row.userId, role: row.role });
    byHousehold.set(row.householdId, list);
  }

  const blocked: SoleAdminHousehold[] = [];
  for (const [householdId, members] of byHousehold) {
    const self = members.find((member) => member.userId === userId && member.role === "admin");
    if (!self) continue;
    if (!canDropAdmin(members, userId)) {
      blocked.push({ householdId });
    }
  }
  return blocked;
}

/** Throws when User deletion would leave any Household without an admin. */
export async function assertUserDeletionAllowed(
  db: CommandDatabase,
  userId: string,
): Promise<void> {
  const blocked = await listSoleAdminHouseholds(db, userId);
  if (blocked.length === 0) return;
  throw Object.assign(new Error(LAST_ADMIN_MESSAGE), {
    code: "SOLE_ADMIN" as const,
    householdIds: blocked.map((row) => row.householdId),
  });
}

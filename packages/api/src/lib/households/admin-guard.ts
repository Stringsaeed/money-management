/**
 * App-owned last-admin guard. WorkOS does not promise that an organization
 * keeps at least one admin, so Trove enforces it before every mutation Trove
 * itself issues (demotion, removal, leaving). Mutations made in the WorkOS
 * widget cannot be prevented here; they are reported as a limitation
 * (`docs/architecture/workos-widget-contract.md`).
 */

export interface AdminGuardMember {
  readonly userId: string;
  readonly role: string;
}

/** True when `targetUserId` can stop being an admin without leaving the Household admin-less. */
export function canDropAdmin(
  activeMembers: readonly AdminGuardMember[],
  targetUserId: string,
): boolean {
  return activeMembers.some((member) => member.role === "admin" && member.userId !== targetUserId);
}

export const LAST_ADMIN_MESSAGE =
  "This Household would have no admin left. Make another member an admin first, or delete the Household.";

import type { HouseholdRole } from "@trove/protocol";

/**
 * Pure household rules shared by API procedures.
 * Kept free of I/O so invariants are testable without a database.
 *
 * Roles reuse the protocol vocabulary; this milestone only grants
 * "owner" and "member", but the checks stay total over all roles so
 * admin/viewer can land without touching call sites.
 */

export const HOUSEHOLD_ROLES = ["owner", "member"] as const;

export const INVITE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const INVITE_CODE_LENGTH = 8;
export const DEFAULT_INVITE_EXPIRY_DAYS = 7;
export const MAX_INVITE_EXPIRY_DAYS = 30;

export function isOwnerRole(role: HouseholdRole): boolean {
  return role === "owner";
}

export function canLeaveHousehold(role: HouseholdRole): boolean {
  return !isOwnerRole(role);
}

export function canManageHousehold(role: HouseholdRole): boolean {
  return isOwnerRole(role);
}

export function canRemoveMember(
  actor: HouseholdRole,
  target: HouseholdRole,
  sameUser: boolean,
): boolean {
  if (sameUser) return false;
  if (!canManageHousehold(actor)) return false;
  return !isOwnerRole(target);
}

export function canTransferOwnership(
  actor: HouseholdRole,
  targetIsMember: boolean,
  sameUser: boolean,
): boolean {
  return canManageHousehold(actor) && targetIsMember && !sameUser;
}

export function isValidInviteExpiryDays(days: number): boolean {
  return Number.isInteger(days) && days >= 1 && days <= MAX_INVITE_EXPIRY_DAYS;
}

/** A code character drawn uniformly from {@link INVITE_ALPHABET}. */
export function inviteCodeChar(random: () => number): string {
  const index = Math.floor(random() * INVITE_ALPHABET.length);
  return INVITE_ALPHABET[index] ?? (INVITE_ALPHABET[0] as string);
}

export function buildInviteCode(random: () => number): string {
  let code = "";
  for (let i = 0; i < INVITE_CODE_LENGTH; i += 1) {
    code += inviteCodeChar(random);
  }
  return code;
}

import { isHouseholdRole, type HouseholdRole } from "@trove/protocol";

import type { MembershipSummary } from "./types";

export function toMembershipSummary(row: {
  readonly householdId: string;
  readonly name: string;
  readonly role: string;
  readonly joinedAt: Date | string;
}): MembershipSummary | null {
  if (!isHouseholdRole(row.role)) return null;
  return {
    householdId: row.householdId,
    name: row.name,
    role: row.role,
    joinedAt: row.joinedAt instanceof Date ? row.joinedAt.toISOString() : row.joinedAt,
  };
}

export function roleLabel(role: HouseholdRole): string {
  switch (role) {
    case "admin":
      return "Admin";
    case "member":
      return "Member";
    case "viewer":
      return "Viewer";
  }
}

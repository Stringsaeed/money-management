import type { MembershipSummary } from "./types";

export function toMembershipSummary(row: {
  readonly householdId: string;
  readonly name: string;
  readonly role: string;
  readonly isActive: boolean;
  readonly createdAt: Date | string;
}): MembershipSummary {
  return {
    householdId: row.householdId,
    name: row.name,
    role: row.role === "owner" ? "owner" : "member",
    isActive: row.isActive,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
  };
}

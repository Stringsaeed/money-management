/**
 * Pure rules for the `member.role.change` command.
 *
 * Free of I/O so invariants are testable without a database, and
 * Hermes-compatible so the client can preview the same validation
 * optimistically before queueing the command in its outbox.
 */

import type { HouseholdRole, ValidationIssue } from "@trove/protocol" with {
  "resolution-mode": "import",
};

/** Roles a `member.role.change` command may grant — ownership moves only via the dedicated transfer flow. */
export const ASSIGNABLE_MEMBER_ROLES: readonly HouseholdRole[] = ["admin", "member", "viewer"];

const ACTOR_ROLES_THAT_MANAGE_MEMBERS: readonly HouseholdRole[] = ["owner", "admin"];

export interface MemberRoleChangeInput {
  /** Role held by the acting user at plan time. */
  readonly actorRole: HouseholdRole;
  /** Role currently held by the membership being changed. */
  readonly targetCurrentRole: HouseholdRole;
  /** Role the command wants to grant. */
  readonly nextRole: HouseholdRole;
  /** True when the actor targets their own membership. */
  readonly sameUser: boolean;
}

/**
 * Validates a role change intent and returns field-level issues.
 * An empty array means the intent is valid; the caller still re-validates
 * preconditions (e.g. `expectedVersion`) inside the commit batch.
 */
export function validateMemberRoleChange(input: MemberRoleChangeInput): readonly ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!ASSIGNABLE_MEMBER_ROLES.includes(input.nextRole)) {
    issues.push({
      field: "payload.role",
      message:
        input.nextRole === "owner"
          ? "Ownership moves through the ownership-transfer flow, not a role change."
          : "Unknown role.",
    });
  }

  if (input.sameUser) {
    issues.push({ field: "payload.userId", message: "You cannot change your own role." });
  }

  if (input.targetCurrentRole === "owner") {
    issues.push({
      field: "payload.userId",
      message: "The household owner's role cannot be changed; transfer ownership instead.",
    });
  }

  if (!ACTOR_ROLES_THAT_MANAGE_MEMBERS.includes(input.actorRole)) {
    issues.push({
      field: "actor",
      message: "Only owners and admins can change member roles.",
    });
  }

  return issues;
}

import { type CommandKind, type HouseholdRole, isHouseholdRole } from "@trove/protocol";

const CAPABILITY_MATRIX: Readonly<Record<CommandKind, readonly HouseholdRole[]>> = {
  "account.create": ["admin"],
  "account.update": ["admin"],
  "account.archive": ["admin"],
  "category.create": ["admin"],
  "category.update": ["admin"],
  "category.archive": ["admin"],
  "transaction.create": ["admin", "member"],
  "transaction.edit": ["admin", "member"],
  "transaction.remove": ["admin", "member"],
  "recurring.change": ["admin"],
  "budget.configure": ["admin"],
  "assignment.commit": ["admin", "member"],
  "assignment.correct": ["admin", "member"],
  "refund.link": ["admin", "member"],
  // One-time local-to-cloud migration (#98): only a Household admin may
  // bulk-import — never a joined member, whose local data is separate.
  import_bundle: ["admin"],
};

/**
 * True when `role` may issue commands of kind `kind`. Viewers can issue
 * nothing; a role slug Trove does not know grants nothing either.
 */
export function can(role: string, kind: CommandKind): boolean {
  return isHouseholdRole(role) && CAPABILITY_MATRIX[kind].includes(role);
}

/** Label surfaced on `forbidden` results so clients know what was missing. */
export function requiredCapability(kind: string): string {
  return `commands:${kind}`;
}

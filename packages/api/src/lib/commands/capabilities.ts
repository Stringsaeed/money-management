import type { CommandKind, HouseholdRole } from "@trove/protocol";

const CAPABILITY_MATRIX: Readonly<Record<CommandKind, readonly HouseholdRole[]>> = {
  "member.role.change": ["owner"],
  "account.create": ["owner", "admin"],
  "account.update": ["owner", "admin"],
  "account.archive": ["owner", "admin"],
  "account.restore": ["owner", "admin"],
  "category.create": ["owner", "admin"],
  "category.update": ["owner", "admin"],
  "category.archive": ["owner", "admin"],
  "transaction.create": ["owner", "admin", "member"],
  "transaction.edit": ["owner", "admin", "member"],
  "transaction.remove": ["owner", "admin", "member"],
  "assignment.commit": ["owner", "admin", "member"],
  "refund.link": ["owner", "admin", "member"],
  // One-time local-to-cloud migration (#98): only the household's creator
  // may bulk-import — never a joined member, whose local data is separate.
  import_bundle: ["owner"],
};

/** True when `role` may issue commands of kind `kind`. Viewers can issue nothing. */
export function can(role: HouseholdRole, kind: CommandKind): boolean {
  return CAPABILITY_MATRIX[kind].includes(role);
}

/** Label surfaced on `forbidden` results so clients know what was missing. */
export function requiredCapability(kind: string): string {
  return `commands:${kind}`;
}

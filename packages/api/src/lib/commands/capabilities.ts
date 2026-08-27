import type { CommandKind, HouseholdRole } from "@trove/protocol";

/**
 * Role capability map: `can(role, commandKind)`.
 *
 * The vocabulary is total over the protocol roles so `admin`/`viewer` can
 * land without touching call sites. The matrix grows phase by phase as
 * command handlers ship (#86, #89, #90, #91); kinds without a registered
 * handler are rejected as not-implemented before authorization matters.
 */
const CAPABILITY_MATRIX: Readonly<Record<CommandKind, readonly HouseholdRole[]>> = {
  "household.create": [],
  "member.invite": ["owner", "admin"],
  "member.role.change": ["owner"],
  "member.remove": ["owner", "admin"],
  // Structural entities (accounts, categories) are owner/admin territory;
  // ledger facts (transactions) are writable by every contributing role.
  "account.create": ["owner", "admin"],
  "account.update": ["owner", "admin"],
  "account.archive": ["owner", "admin"],
  "category.create": ["owner", "admin"],
  "category.update": ["owner", "admin"],
  "category.archive": ["owner", "admin"],
  "transaction.create": ["owner", "admin", "member"],
  "transaction.edit": ["owner", "admin", "member"],
  "transaction.remove": ["owner", "admin", "member"],
  "assignment.commit": ["owner", "admin", "member"],
  "card_payment.record": ["owner", "admin", "member"],
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
export function requiredCapability(kind: CommandKind): string {
  return `commands:${kind}`;
}

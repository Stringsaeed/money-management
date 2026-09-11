/**
 * Ledger Scope: who owns a financial record.
 *
 * Every Account, Category, and Transaction belongs to exactly one Ledger,
 * owned either by one WorkOS User (a Personal Ledger) or by one WorkOS
 * organization (an Organization Ledger, shared among its active Members).
 * Personal sync therefore needs no hidden organization.
 *
 * The ledger id is the only scope token that travels on the wire and in the
 * database: `personal:${userId}` for a Personal Ledger, the organization id
 * for an Organization Ledger. Until Household administration migrates to
 * WorkOS (#228) the organization id is the existing Household id, so an
 * Organization Ledger id and its Household id are the same string.
 */

/** Prefix that makes Personal Ledger ids self-describing and parseable. */
export const PERSONAL_LEDGER_PREFIX = "personal:";

export type LedgerScope =
  | { readonly type: "personal"; readonly userId: string }
  | { readonly type: "organization"; readonly organizationId: string };

export type LedgerScopeType = LedgerScope["type"];

/** The ledger id owned by one User: `personal:${userId}`. */
export function personalLedgerId(userId: string): string {
  return `${PERSONAL_LEDGER_PREFIX}${userId}`;
}

/**
 * The ledger id owned by one organization. It equals the organization id, and
 * during the Household transition (#228) the organization id is the Household
 * id — so an Organization Ledger id is still a Household id today.
 */
export function organizationLedgerId(organizationId: string): string {
  return organizationId;
}

/** The ledger id a scope addresses. */
export function ledgerIdForScope(scope: LedgerScope): string {
  return scope.type === "personal"
    ? personalLedgerId(scope.userId)
    : organizationLedgerId(scope.organizationId);
}

/**
 * Reads a ledger id back into its scope, or null when the id names no owner
 * (an empty id, or a `personal:` prefix with no User behind it).
 */
export function parseLedgerId(ledgerId: string): LedgerScope | null {
  if (ledgerId.startsWith(PERSONAL_LEDGER_PREFIX)) {
    const userId = ledgerId.slice(PERSONAL_LEDGER_PREFIX.length);
    return userId.length > 0 ? { type: "personal", userId } : null;
  }
  return ledgerId.length > 0 ? { type: "organization", organizationId: ledgerId } : null;
}

/** True when the ledger id names a Personal Ledger. */
export function isPersonalLedgerId(ledgerId: string): boolean {
  return parseLedgerId(ledgerId)?.type === "personal";
}

/** The User who owns this Personal Ledger, or null for any other ledger. */
export function personalLedgerOwner(ledgerId: string): string | null {
  const scope = parseLedgerId(ledgerId);
  return scope?.type === "personal" ? scope.userId : null;
}

/** True when both scopes address the same ledger. */
export function sameLedgerScope(left: LedgerScope, right: LedgerScope): boolean {
  return ledgerIdForScope(left) === ledgerIdForScope(right);
}

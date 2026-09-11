import { ORPCError } from "@orpc/server";
import {
  isPersonalLedgerId,
  ledgerIdForScope,
  personalLedgerOwner,
  resolveCommandScope,
  type CommandScope,
} from "@trove/protocol";

import type { CommandDatabase } from "./commands/types";
import { findActiveMembership } from "./membership/access";

/** A caller already narrowed to one household context. */
export interface HouseholdCaller {
  readonly userId: string;
  readonly householdId: string;
}

/** A caller already narrowed to one Ledger — personal or organization. */
export interface LedgerCaller {
  readonly userId: string;
  readonly ledgerId: string;
}

/**
 * Household tenancy gate shared by budget-domain reads. There is no RLS and no
 * DB-level backstop — this check is what keeps one household out of another's
 * data, so every entry point must run it before any scoped read.
 *
 * Any active member role may pass, including `viewer`: reads are allowed,
 * writes are separately gated by the command capability map (`can(role, kind)`).
 */
export async function requireHouseholdMember(
  db: CommandDatabase,
  userId: string,
  householdId: string,
): Promise<void> {
  const active = await findActiveMembership(db, userId, householdId);
  if (!active) {
    throw new ORPCError("FORBIDDEN", {
      message: "You are not a member of this household.",
    });
  }
}

/**
 * Ledger tenancy gate for budget and recurring reads. A Personal Ledger is
 * owned by its User; an organization Ledger still checks Household membership
 * (the organization id is the Household id until #228).
 */
export async function requireLedgerAccess(
  db: CommandDatabase,
  userId: string,
  ledgerId: string,
): Promise<void> {
  if (isPersonalLedgerId(ledgerId)) {
    if (personalLedgerOwner(ledgerId) !== userId) {
      throw new ORPCError("FORBIDDEN", {
        message: "You do not own this ledger.",
      });
    }
    return;
  }
  await requireHouseholdMember(db, userId, ledgerId);
}

/** Resolves a read request to the Ledger it names, or throws when it names none. */
export function resolveReadLedgerId(
  userId: string,
  input: { readonly householdId?: string; readonly scope?: CommandScope },
): string {
  const scope = resolveCommandScope(input, userId);
  if (!scope) {
    throw new ORPCError("BAD_REQUEST", {
      message: "Name the ledger this read belongs to: a personal or organization scope.",
    });
  }
  return ledgerIdForScope(scope);
}

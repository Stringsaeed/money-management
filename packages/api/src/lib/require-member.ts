import { and, eq } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import {
  isPersonalLedgerId,
  ledgerIdForScope,
  personalLedgerOwner,
  resolveCommandScope,
  type CommandScope,
} from "@trove/protocol";

import { membership } from "@trove/db/schema/household";

import type { CommandDatabase } from "./commands/types";

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
 * Household tenancy gate shared by budget-domain reads. D1 has no RLS and no
 * DB-level backstop — this check is what keeps one household out of another's
 * data, so every entry point must run it before any scoped read.
 *
 * Any member role may pass, including `viewer`: reads are allowed, writes are
 * separately gated by the command capability map (`can(role, kind)`).
 */
export async function requireHouseholdMember(
  db: CommandDatabase,
  userId: string,
  householdId: string,
): Promise<void> {
  const rows = await db
    .select({ id: membership.id })
    .from(membership)
    .where(and(eq(membership.userId, userId), eq(membership.householdId, householdId)))
    .limit(1);
  if (!rows[0]) {
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

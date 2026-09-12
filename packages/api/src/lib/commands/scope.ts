import { sql } from "drizzle-orm";
import type { LedgerScope } from "@trove/protocol";
import { ledgerIdForScope, personalLedgerId } from "@trove/protocol";

import { ledger } from "@trove/db/schema/ledger-scope";

import type { CommandDatabase } from "./types";

/** The authenticated identity a command is attributed to. */
export interface CommandActor {
  readonly id: string;
  readonly email?: string;
  readonly name?: string;
}

/** A resolved Ledger Scope, with the ids every layer below the pipeline needs. */
export interface ScopeBinding {
  readonly scope: LedgerScope;
  readonly ledgerId: string;
  /** Household backing an organization Ledger; null for a Personal Ledger. */
  readonly householdId: string | null;
}

export function bindLedgerScope(scope: LedgerScope): ScopeBinding {
  return {
    scope,
    ledgerId: ledgerIdForScope(scope),
    householdId: scope.type === "organization" ? scope.organizationId : null,
  };
}

/**
 * Projects the verified WorkOS identity into the local `user` table.
 *
 * WorkOS owns identity, but every financial row attributes `created_by` /
 * `updated_by` to a local user row. Writing the projection here — from
 * verified claims only — keeps a first command from failing on a foreign key
 * the moment a User signs in on a fresh device.
 *
 * Inserts only id/name/email/email_verified so first-login works when prod is
 * missing later columns such as memberships_reconciled_at (0013). Drizzle's
 * table insert lists every schema column and throws PG 42703 before ON CONFLICT.
 */
export async function ensureUserProjection(
  db: CommandDatabase,
  actor: CommandActor,
): Promise<void> {
  const email = actor.email?.trim();
  // WorkOS verifies the address before it issues a session; the local row
  // only mirrors that fact for display. AuthKit access tokens often omit
  // `email`, so fall back to a stable placeholder until a claim or
  // directory read supplies one.
  const resolvedEmail = email || `${actor.id}@users.workos.invalid`;
  const name = actor.name?.trim() || email || actor.id;
  await db.execute(sql`
    INSERT INTO "user" ("id", "name", "email", "email_verified")
    VALUES (${actor.id}, ${name}, ${resolvedEmail}, ${true})
    ON CONFLICT DO NOTHING
  `);
}

/**
 * Creates the caller's Personal Ledger if this is their first personal write.
 * Idempotent: concurrent first writes converge on the same row.
 */
export async function ensurePersonalLedger(db: CommandDatabase, userId: string): Promise<string> {
  const id = personalLedgerId(userId);
  await db
    .insert(ledger)
    .values({ id, kind: "personal", personalUserId: userId })
    .onConflictDoNothing();
  return id;
}

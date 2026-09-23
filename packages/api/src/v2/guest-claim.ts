import { and, eq, sql } from "drizzle-orm";

import {
  v2Account,
  v2Category,
  v2IdempotencyKey,
  v2Ledger,
  v2RecurringOccurrence,
  v2RecurringRule,
  v2Transaction,
} from "@trove/db/schema/v2-ledger";

import type { V2Database, V2TransactionDatabase } from "./shared";
import { V2ApiError } from "./shared";

export type GuestLedgerClaimResult =
  | { readonly kind: "none" }
  | { readonly kind: "claimed"; readonly ledgerId: string }
  | { readonly kind: "reused_user_ledger"; readonly ledgerId: string }
  | { readonly kind: "conflict"; readonly guestLedgerId: string; readonly userLedgerId: string };

export interface GuestLedgerClaimInput {
  readonly guestSessionId: string;
  readonly user: { readonly userId: string };
}

/**
 * Claims a guest ledger during authentication. The operation is intentionally
 * small and transactional so auth can call it before provisioning the user's
 * empty ledger. A non-empty guest plus non-empty user ledger is left untouched
 * and reported as a conflict for an explicit user choice.
 */
export async function claimGuestLedger(
  db: V2Database,
  guestSessionId: string,
  userId: string,
): Promise<GuestLedgerClaimResult> {
  return db.transaction((tx) => claimGuestLedgerResultInTransaction(tx, guestSessionId, userId));
}

export async function claimGuestLedgerInTransaction(
  tx: V2TransactionDatabase,
  input: GuestLedgerClaimInput,
): Promise<"claimed" | "conflict"> {
  const result = await claimGuestLedgerResultInTransaction(
    tx,
    input.guestSessionId,
    input.user.userId,
  );
  return result.kind === "conflict" ? "conflict" : "claimed";
}

async function claimGuestLedgerResultInTransaction(
  tx: V2TransactionDatabase,
  guestSessionId: string,
  userId: string,
): Promise<GuestLedgerClaimResult> {
  await lockClaimOwners(tx, guestSessionId, userId);
  let { guestRows, userRows } = await loadClaimOwners(tx, guestSessionId, userId);
  await lockActualLedgers(tx, guestRows[0]?.id, userRows[0]?.id);

  // A write may have committed while owner locks were being acquired. Re-read
  // after the actual ledger locks so the claim decision includes that write.
  ({ guestRows, userRows } = await loadClaimOwners(tx, guestSessionId, userId));
  const guest = guestRows[0];
  if (!guest) return { kind: "none" };
  return applyClaimDecision(tx, guest.id, userRows[0]?.id ?? null, userId);
}

async function lockClaimOwners(
  tx: V2TransactionDatabase,
  guestSessionId: string,
  userId: string,
): Promise<void> {
  await lockKeys(tx, [
    `guest:${guestSessionId}`,
    `user:${userId}`,
    `v2:guest:${guestSessionId}`,
    `v2:user:${userId}`,
  ]);
}

async function lockActualLedgers(
  tx: V2TransactionDatabase,
  guestLedgerId?: string,
  userLedgerId?: string,
): Promise<void> {
  await lockKeys(
    tx,
    [guestLedgerId, userLedgerId].filter((id): id is string => id !== undefined),
  );
}

async function lockKeys(tx: V2TransactionDatabase, keys: readonly string[]): Promise<void> {
  for (const key of [...new Set(keys)].sort()) {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${key}))`);
  }
}

async function loadClaimOwners(tx: V2TransactionDatabase, guestSessionId: string, userId: string) {
  const [guestRows, userRows] = await Promise.all([
    tx
      .select({ id: v2Ledger.id })
      .from(v2Ledger)
      .where(and(eq(v2Ledger.ownerType, "guest"), eq(v2Ledger.ownerId, guestSessionId)))
      .limit(1),
    tx
      .select({ id: v2Ledger.id })
      .from(v2Ledger)
      .where(and(eq(v2Ledger.ownerType, "user"), eq(v2Ledger.ownerId, userId)))
      .limit(1),
  ]);
  return { guestRows, userRows };
}

async function applyClaimDecision(
  tx: V2TransactionDatabase,
  guestLedgerId: string,
  userLedgerId: string | null,
  userId: string,
): Promise<GuestLedgerClaimResult> {
  const [guestHasFacts, userHasFacts] = await Promise.all([
    ledgerHasFacts(tx, guestLedgerId),
    userLedgerId ? ledgerHasFacts(tx, userLedgerId) : Promise.resolve(false),
  ]);
  if (userLedgerId && guestHasFacts && userHasFacts) {
    return { kind: "conflict", guestLedgerId, userLedgerId };
  }
  if (userLedgerId && !guestHasFacts) {
    await tx.delete(v2Ledger).where(eq(v2Ledger.id, guestLedgerId));
    return { kind: "reused_user_ledger", ledgerId: userLedgerId };
  }
  if (userLedgerId && !userHasFacts) await tx.delete(v2Ledger).where(eq(v2Ledger.id, userLedgerId));
  const claimed = await tx
    .update(v2Ledger)
    .set({ ownerType: "user", ownerId: userId, updatedAt: new Date() })
    .where(eq(v2Ledger.id, guestLedgerId))
    .returning({ id: v2Ledger.id });
  if (!claimed[0])
    throw new V2ApiError(500, "guest_claim_failed", "Guest ledger could not be claimed.");
  return { kind: "claimed", ledgerId: claimed[0].id };
}

async function ledgerHasFacts(db: Pick<V2Database, "select">, ledgerId: string): Promise<boolean> {
  const [account, category, transaction, rule, occurrence, idempotency] = await Promise.all([
    db
      .select({ id: v2Account.id })
      .from(v2Account)
      .where(eq(v2Account.ledgerId, ledgerId))
      .limit(1),
    db
      .select({ id: v2Category.id })
      .from(v2Category)
      .where(eq(v2Category.ledgerId, ledgerId))
      .limit(1),
    db
      .select({ id: v2Transaction.id })
      .from(v2Transaction)
      .where(eq(v2Transaction.ledgerId, ledgerId))
      .limit(1),
    db
      .select({ id: v2RecurringRule.id })
      .from(v2RecurringRule)
      .where(eq(v2RecurringRule.ledgerId, ledgerId))
      .limit(1),
    db
      .select({ id: v2RecurringOccurrence.id })
      .from(v2RecurringOccurrence)
      .where(eq(v2RecurringOccurrence.ledgerId, ledgerId))
      .limit(1),
    db
      .select({ key: v2IdempotencyKey.key })
      .from(v2IdempotencyKey)
      .where(eq(v2IdempotencyKey.ledgerId, ledgerId))
      .limit(1),
  ]);
  return Boolean(
    account[0] || category[0] || transaction[0] || rule[0] || occurrence[0] || idempotency[0],
  );
}

import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";

import type { createDb } from "@trove/db";
import { v2GuestSession } from "@trove/db/schema/v2-identity";
import { v2IdempotencyKey, v2Ledger } from "@trove/db/schema/v2-ledger";

import { principalOwner, type V2LedgerScope, type V2Principal } from "./contracts";

export type V2Database = ReturnType<typeof createDb>;
export type V2TransactionDatabase = Pick<
  V2Database,
  "select" | "insert" | "update" | "delete" | "execute"
>;
export type V2DbExecutor = V2Database | V2TransactionDatabase;
export type V2ErrorDetails = Readonly<Record<string, string | number | boolean | null>>;

export class V2ApiError extends Error {
  constructor(
    readonly status: 400 | 401 | 403 | 404 | 409 | 412 | 422 | 429 | 500 | 503,
    readonly code: string,
    message: string,
    readonly details?: V2ErrorDetails,
  ) {
    super(message);
    this.name = "V2ApiError";
  }
}

export interface V2LedgerContext {
  readonly db: V2Database;
  readonly principal: V2Principal;
  readonly scope: V2LedgerScope;
  readonly ledgerId: string;
  readonly ownerType: "user" | "guest" | "household";
  readonly ownerId: string;
}

export type AuthorizeV2Household = (
  principal: V2Principal,
  householdId: string,
  access: "read" | "write",
) => Promise<void>;

export interface V2LedgerContextOptions {
  readonly authorizeHousehold?: AuthorizeV2Household;
  readonly access?: "read" | "write";
}

export async function resolveV2LedgerContext(
  db: V2Database,
  principal: V2Principal,
  scope: V2LedgerScope,
  options: V2LedgerContextOptions = {},
): Promise<V2LedgerContext> {
  await assertPrincipalActive(db, principal);
  if (scope.kind === "household") {
    if (!options.authorizeHousehold) {
      throw new V2ApiError(
        403,
        "household_authorization_unavailable",
        "Household access is unavailable.",
      );
    }
    await options.authorizeHousehold(principal, scope.householdId, options.access ?? "read");
    const ownerType = "household" as const;
    const ownerId = scope.householdId;
    return {
      db,
      principal,
      scope,
      ledgerId: await ensureLedger(db, ownerType, ownerId, principal),
      ownerType,
      ownerId,
    };
  }

  const owner = principalOwner(principal);
  return {
    db,
    principal,
    scope,
    ledgerId: await ensureLedger(db, owner.ownerType, owner.ownerId, principal),
    ownerType: owner.ownerType,
    ownerId: owner.ownerId,
  };
}

export async function ensureLedger(
  db: V2Database,
  ownerType: "user" | "guest" | "household",
  ownerId: string,
  principal?: V2Principal,
): Promise<string> {
  return db.transaction(async (tx) => {
    const deterministicId = `v2:${ownerType}:${ownerId}`;
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${deterministicId}))`);
    if (principal) await assertPrincipalActive(tx, principal);
    const existing = await tx
      .select({ id: v2Ledger.id })
      .from(v2Ledger)
      .where(and(eq(v2Ledger.ownerType, ownerType), eq(v2Ledger.ownerId, ownerId)))
      .limit(1);
    if (existing[0]) return existing[0].id;

    await tx
      .insert(v2Ledger)
      .values({ id: deterministicId, ownerType, ownerId })
      .onConflictDoNothing();
    const created = await tx
      .select({ id: v2Ledger.id })
      .from(v2Ledger)
      .where(and(eq(v2Ledger.ownerType, ownerType), eq(v2Ledger.ownerId, ownerId)))
      .limit(1);
    if (!created[0]) {
      throw new V2ApiError(
        500,
        "ledger_provision_failed",
        "The V2 ledger could not be provisioned.",
      );
    }
    return created[0].id;
  });
}

export async function withLedgerMutation<T>(
  context: V2LedgerContext,
  operation: string,
  idempotencyKey: string | undefined,
  run: (db: V2TransactionDatabase) => Promise<T>,
): Promise<T> {
  return context.db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${context.ledgerId}))`);

    const ownerRows = await tx
      .select({ ownerType: v2Ledger.ownerType, ownerId: v2Ledger.ownerId })
      .from(v2Ledger)
      .where(eq(v2Ledger.id, context.ledgerId))
      .limit(1);
    const owner = ownerRows[0];
    if (!owner || owner.ownerType !== context.ownerType || owner.ownerId !== context.ownerId) {
      throw new V2ApiError(
        409,
        "ledger_reassigned",
        "This ledger ownership changed. Refresh the session before retrying.",
      );
    }
    await assertPrincipalActive(tx, context.principal);

    if (idempotencyKey) {
      const previous = await tx
        .select()
        .from(v2IdempotencyKey)
        .where(
          and(
            eq(v2IdempotencyKey.ledgerId, context.ledgerId),
            eq(v2IdempotencyKey.key, idempotencyKey),
          ),
        )
        .limit(1);
      if (previous[0]) {
        if (previous[0].operation !== operation) {
          throw new V2ApiError(
            409,
            "idempotency_key_reused",
            "The Idempotency-Key was already used for another operation.",
          );
        }
        // SAFETY: the idempotency row is written by this operation before any replay is possible.
        return previous[0].responseJson as T;
      }
    }

    const result = await run(tx);
    if (idempotencyKey) {
      await tx.insert(v2IdempotencyKey).values({
        ledgerId: context.ledgerId,
        key: idempotencyKey,
        operation,
        statusCode: 200,
        responseJson: result,
      });
    }
    return result;
  });
}

/** Rechecks ephemeral guest credentials inside the same transaction as a write. */
export async function assertPrincipalActive(
  db: V2DbExecutor,
  principal: V2Principal,
): Promise<void> {
  if (principal.kind !== "guest") return;
  const rows = await db
    .select({ status: v2GuestSession.status, expiresAt: v2GuestSession.expiresAt })
    .from(v2GuestSession)
    .where(eq(v2GuestSession.id, principal.guestSessionId))
    .limit(1);
  const session = rows[0];
  if (!session || session.status !== "active" || session.expiresAt <= new Date()) {
    throw new V2ApiError(401, "guest_session_invalid", "This guest session is no longer valid.");
  }
}

export function requireExpectedVersion(
  expectedVersion: number | undefined,
  actualVersion: number,
  entityId: string,
): void {
  if (expectedVersion === undefined) return;
  if (!Number.isInteger(expectedVersion) || expectedVersion < 0) {
    throw new V2ApiError(
      400,
      "invalid_version",
      "Expected version must be a non-negative integer.",
    );
  }
  if (expectedVersion !== actualVersion) {
    throw new V2ApiError(412, "version_conflict", "The resource changed. Refresh and try again.", {
      entityId,
      expectedVersion,
      actualVersion,
    });
  }
}

export function parseExpectedVersion(value: string | null | undefined): number | undefined {
  if (value === undefined || value === null || value.trim() === "") return undefined;
  const normalized = value.trim().replace(/^W\//, "").replace(/^"|"$/g, "");
  if (!/^\d+$/.test(normalized)) {
    throw new V2ApiError(
      400,
      "invalid_version",
      "If-Match must contain a non-negative integer version.",
    );
  }
  return Number(normalized);
}

export function safeMinor(value: number | string | bigint, label: string): number {
  const parsed = z.coerce.number().safeParse(value);
  const numberValue = parsed.success ? parsed.data : Number.NaN;
  if (!Number.isSafeInteger(numberValue)) {
    throw new V2ApiError(
      500,
      "unsafe_money_value",
      `${label} is outside the supported money range.`,
    );
  }
  return numberValue;
}

export function dateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function iso(value: Date): string {
  return value.toISOString();
}

export function idempotencyKeyFromHeader(value: string | null | undefined): string | undefined {
  const key = value?.trim();
  if (!key) return undefined;
  if (key.length > 200) {
    throw new V2ApiError(
      400,
      "invalid_idempotency_key",
      "Idempotency-Key must be 200 characters or fewer.",
    );
  }
  return key;
}

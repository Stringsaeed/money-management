import { ORPCError } from "@orpc/server";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import {
  readBearerToken,
  resolveWorkOSVerifyEnv,
  verifyAccessToken,
  type AuthSession,
  type WorkOSServerEnv,
} from "@trove/auth";
import type { createDb } from "@trove/db";
import { v2GuestSession, v2Identity } from "@trove/db/schema/v2-identity";

export type V2Database = ReturnType<typeof createDb>;
export type V2Transaction = Parameters<Parameters<V2Database["transaction"]>[0]>[0];
export type V2DbExecutor = V2Database | V2Transaction;

export type V2UserPrincipal = {
  readonly kind: "user";
  readonly userId: string;
  readonly workosUserId: string;
  readonly email: string;
  readonly name: string;
};

export type V2GuestPrincipal = {
  readonly kind: "guest";
  readonly guestSessionId: string;
};

export type V2Principal = V2UserPrincipal | V2GuestPrincipal;

export interface V2AuthErrorOptions {
  readonly status: 400 | 401 | 403 | 404 | 409 | 429 | 503;
  readonly code: string;
  readonly message: string;
}

export class V2AuthError extends Error {
  readonly status: V2AuthErrorOptions["status"];
  readonly code: string;

  constructor(options: V2AuthErrorOptions) {
    super(options.message);
    this.name = "V2AuthError";
    this.status = options.status;
    this.code = options.code;
  }
}

export interface GuestLedgerClaimInput {
  readonly guestSessionId: string;
  readonly user: V2UserPrincipal;
}

export type GuestLedgerClaimResult = "claimed" | "already_claimed" | "conflict";

export interface V2AuthDeps {
  readonly db: V2Database;
  readonly now?: () => Date;
  readonly guestSessionTtlMs?: number;
  readonly guestIssueWindowMs?: number;
  readonly guestIssueLimit?: number;
  /**
   * Called inside the same Drizzle transaction as the guest-session claim.
   * The financial V2 tables own the actual data transfer; auth refuses to
   * claim when this callback is not wired.
   */
  readonly claimGuestLedger: (
    db: V2Transaction,
    input: GuestLedgerClaimInput,
  ) => Promise<GuestLedgerClaimResult>;
}

export interface WorkOSVerifierConfig extends WorkOSServerEnv {
  readonly WORKOS_CLIENT_ID: string;
}

const DEFAULT_GUEST_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const DEFAULT_GUEST_ISSUE_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_GUEST_ISSUE_LIMIT = 10;

function nowOf(deps: V2AuthDeps): Date {
  return deps.now?.() ?? new Date();
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

async function randomToken(bytes = 32): Promise<string> {
  const values = new Uint8Array(bytes);
  crypto.getRandomValues(values);
  return base64UrlEncode(values);
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return base64UrlEncode(new Uint8Array(digest));
}

export function guestTokenFromAuthorization(
  authorization: string | null | undefined,
  headerToken?: string | null,
): string | null {
  const explicit = headerToken?.trim();
  if (explicit) return explicit;
  if (!authorization) return null;
  const match = /^Guest\s+(.+)$/i.exec(authorization.trim());
  return match?.[1]?.trim() || null;
}

export async function issueGuestSession(
  deps: V2AuthDeps,
  input: { readonly clientKey: string },
): Promise<{
  readonly principal: V2GuestPrincipal;
  readonly token: string;
  readonly expiresAt: Date;
}> {
  const now = nowOf(deps);
  const windowMs = deps.guestIssueWindowMs ?? DEFAULT_GUEST_ISSUE_WINDOW_MS;
  const limit = deps.guestIssueLimit ?? DEFAULT_GUEST_ISSUE_LIMIT;
  const clientKeyHash = await sha256(`v2-guest-issue:${input.clientKey || "unknown"}`);
  const cutoff = new Date(now.getTime() - windowMs);
  const rows = await deps.db
    .select({ count: sql<number>`count(*)` })
    .from(v2GuestSession)
    .where(
      and(eq(v2GuestSession.clientKeyHash, clientKeyHash), gt(v2GuestSession.createdAt, cutoff)),
    );
  if (Number(rows[0]?.count ?? 0) >= limit) {
    throw new V2AuthError({
      status: 429,
      code: "guest_rate_limited",
      message: "Too many guest sessions were requested. Try again shortly.",
    });
  }

  const token = await randomToken();
  const guestSessionId = `guest_${crypto.randomUUID()}`;
  const expiresAt = new Date(now.getTime() + (deps.guestSessionTtlMs ?? DEFAULT_GUEST_TTL_MS));
  await deps.db.insert(v2GuestSession).values({
    id: guestSessionId,
    tokenHash: await sha256(`v2-guest-token:${token}`),
    clientKeyHash,
    status: "active",
    expiresAt,
    createdAt: now,
    updatedAt: now,
  });
  return { principal: { kind: "guest", guestSessionId }, token, expiresAt };
}

export async function resolveGuestPrincipal(
  deps: V2AuthDeps,
  token: string,
): Promise<V2GuestPrincipal> {
  const tokenHash = await sha256(`v2-guest-token:${token}`);
  const rows = await deps.db
    .select({
      id: v2GuestSession.id,
      status: v2GuestSession.status,
      expiresAt: v2GuestSession.expiresAt,
    })
    .from(v2GuestSession)
    .where(eq(v2GuestSession.tokenHash, tokenHash))
    .limit(1);
  const row = rows[0];
  const now = nowOf(deps);
  if (!row || row.status !== "active" || row.expiresAt <= now) {
    throw new V2AuthError({
      status: 401,
      code: "guest_session_invalid",
      message: "This guest session is no longer valid.",
    });
  }
  return { kind: "guest", guestSessionId: row.id };
}

export async function ensureV2UserIdentity(
  db: V2DbExecutor,
  user: V2UserPrincipal,
  now = new Date(),
): Promise<void> {
  await db
    .insert(v2Identity)
    .values({
      id: user.userId,
      kind: "user",
      workosUserId: user.workosUserId,
      email: user.email,
      name: user.name || user.email || user.workosUserId,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: v2Identity.id,
      set: {
        kind: "user",
        workosUserId: user.workosUserId,
        email: user.email,
        name: user.name || user.email || user.workosUserId,
        updatedAt: now,
      },
    });
}

export async function claimGuestSession(
  deps: V2AuthDeps,
  input: { readonly token: string; readonly user: V2UserPrincipal },
): Promise<{ readonly status: "claimed" | "already_claimed"; readonly guestSessionId: string }> {
  const tokenHash = await sha256(`v2-guest-token:${input.token}`);
  const now = nowOf(deps);
  return deps.db.transaction(async (tx) => {
    const rows = await tx
      .select()
      .from(v2GuestSession)
      .where(eq(v2GuestSession.tokenHash, tokenHash))
      .for("update")
      .limit(1);
    const session = rows[0];
    if (!session || session.expiresAt <= now || session.status === "revoked") {
      throw new V2AuthError({
        status: 401,
        code: "guest_session_invalid",
        message: "This guest session is no longer valid.",
      });
    }
    if (session.status === "claimed") {
      if (session.claimedByUserId === input.user.userId) {
        return { status: "already_claimed", guestSessionId: session.id } as const;
      }
      throw new V2AuthError({
        status: 409,
        code: "guest_session_claimed",
        message: "This guest session belongs to another account.",
      });
    }

    await ensureV2UserIdentity(tx, input.user, now);
    if (!deps.claimGuestLedger) {
      throw new V2AuthError({
        status: 503,
        code: "guest_claim_unavailable",
        message: "Guest data claiming is temporarily unavailable. Try again later.",
      });
    }
    const result = await deps.claimGuestLedger(tx, {
      guestSessionId: session.id,
      user: input.user,
    });
    if (result === "conflict") {
      throw new V2AuthError({
        status: 409,
        code: "guest_ledger_conflict",
        message: "Your account already has V2 ledger data. Guest data was preserved.",
      });
    }
    await tx
      .update(v2GuestSession)
      .set({
        status: "claimed",
        claimedByUserId: input.user.userId,
        claimedAt: now,
        revokedAt: now,
        updatedAt: now,
      })
      .where(and(eq(v2GuestSession.id, session.id), eq(v2GuestSession.status, "active")));
    return { status: "claimed", guestSessionId: session.id } as const;
  });
}

export async function revokeGuestSession(deps: V2AuthDeps, token: string): Promise<void> {
  const tokenHash = await sha256(`v2-guest-token:${token}`);
  await deps.db
    .update(v2GuestSession)
    .set({ status: "revoked", revokedAt: nowOf(deps), updatedAt: nowOf(deps) })
    .where(and(eq(v2GuestSession.tokenHash, tokenHash), isNull(v2GuestSession.revokedAt)));
}

export async function principalFromWorkOSBearer(
  authorization: string | null | undefined,
  config: WorkOSVerifierConfig,
): Promise<V2UserPrincipal> {
  const token = readBearerToken(authorization);
  if (!token) {
    throw new V2AuthError({
      status: 401,
      code: "missing_bearer",
      message: "Sign in to continue.",
    });
  }
  try {
    const resolved = resolveWorkOSVerifyEnv(config);
    const session: AuthSession = await verifyAccessToken(token, {
      clientId: resolved.clientId,
      audience: resolved.audience,
      issuer: resolved.issuer,
      authHostname: resolved.authHostname ?? undefined,
    });
    return {
      kind: "user",
      userId: session.user.id,
      workosUserId: session.user.id,
      email: session.user.email,
      name: session.user.name,
    };
  } catch {
    throw new V2AuthError({
      status: 401,
      code: "invalid_workos_session",
      message: "Your sign-in session is invalid or expired.",
    });
  }
}

export function requireUserPrincipal(principal: V2Principal): V2UserPrincipal {
  if (principal.kind !== "user") {
    throw new V2AuthError({
      status: 403,
      code: "registered_account_required",
      message: "Sign in to use this feature.",
    });
  }
  return principal;
}

// API error boundaries intentionally accept unknown thrown values and redact
// them into a stable client-safe response.
// oxlint-disable-next-line anti-slop/no-unknown-parameters
export function v2AuthErrorResponse(error: unknown) {
  if (error instanceof V2AuthError) {
    return { status: error.status, body: { error: { code: error.code, message: error.message } } };
  }
  if (error instanceof ORPCError) {
    return {
      status: error.status,
      body: { error: { code: error.code, message: error.message } },
    };
  }
  return {
    status: 500,
    body: { error: { code: "internal_error", message: "Something went wrong. Try again." } },
  };
}

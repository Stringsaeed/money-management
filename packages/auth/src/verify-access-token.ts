import { createRemoteJWKSet, errors, jwtVerify, type JWTPayload, type JWTVerifyGetKey } from "jose";
import { z } from "zod";

import type { AuthSession, AuthUser, WorkOSTokenVerifyConfig } from "./session";

export type TokenVerifyFailureCode =
  | "missing_token"
  | "expired"
  | "bad_signature"
  | "unknown_kid"
  | "claim_aud"
  | "claim_client_id"
  | "claim_iss"
  | "claim_sub"
  | "invalid_token"
  | "verification_unavailable";

export class TokenVerifyError extends Error {
  readonly code: TokenVerifyFailureCode;

  constructor(code: TokenVerifyFailureCode, message?: string) {
    // Never allow empty message: CF / oRPC may log Error.message alone.
    const text = message?.trim() ? message : code;
    super(text);
    this.name = "TokenVerifyError";
    this.code = code;
  }
}

const remoteJwksCache = new Map<string, JWTVerifyGetKey>();

const orgObjectSchema = z.object({ id: z.string().min(1) }).passthrough();

export function jwksUrlForClient(clientId: string): URL {
  return new URL(`https://api.workos.com/sso/jwks/${encodeURIComponent(clientId)}`);
}

export function getRemoteJwks(clientId: string): JWTVerifyGetKey {
  const url = jwksUrlForClient(clientId).toString();
  const cached = remoteJwksCache.get(url);
  if (cached) return cached;
  const jwks = createRemoteJWKSet(new URL(url));
  remoteJwksCache.set(url, jwks);
  return jwks;
}

export function readBearerToken(authorization: string | null | undefined): string | null {
  if (!authorization) return null;
  const match = /^Bearer\s+(.+)$/i.exec(authorization.trim());
  return match?.[1]?.trim() || null;
}

export function sessionFromClaims(payload: JWTPayload): AuthSession {
  const subject = z.string().min(1).safeParse(payload.sub);
  if (!subject.success) {
    throw new TokenVerifyError("claim_sub", "Access token is missing subject.");
  }

  const email = z.string().safeParse(payload.email).success ? z.string().parse(payload.email) : "";
  const nameClaim = z.string().min(1).safeParse(payload.name);
  const firstName = z.string().min(1).safeParse(payload.first_name);
  const lastName = z.string().min(1).safeParse(payload.last_name);
  const composedName = [
    firstName.success ? firstName.data : null,
    lastName.success ? lastName.data : null,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  const user: AuthUser = {
    id: subject.data,
    email,
    name: nameClaim.success ? nameClaim.data : composedName || email || subject.data,
  };

  return {
    user,
    organizationId: readOrganizationId(payload),
    sessionId: z.string().min(1).safeParse(payload.sid).success
      ? z.string().min(1).parse(payload.sid)
      : null,
  };
}

export async function verifyAccessToken(
  token: string,
  config: WorkOSTokenVerifyConfig,
): Promise<AuthSession> {
  if (!token.trim()) throw new TokenVerifyError("missing_token");
  if (!config.clientId.trim()) {
    throw new TokenVerifyError("verification_unavailable", "WorkOS client id is not configured.");
  }
  if (!config.audience.trim()) {
    throw new TokenVerifyError("verification_unavailable", "WorkOS audience is not configured.");
  }
  if (!config.issuer.trim()) {
    throw new TokenVerifyError("verification_unavailable", "WorkOS issuer is not configured.");
  }

  const issuer = config.issuer.endsWith("/")
    ? [config.issuer, config.issuer.slice(0, -1)]
    : [config.issuer, `${config.issuer}/`];

  try {
    // WorkOS AuthKit session tokens carry `client_id` and omit `aud` unless a
    // JWT template adds one. Passing `audience` to jose rejects every default
    // session token (`missing required "aud" claim`) → API-wide 401.
    const { payload } = await jwtVerify(token, config.jwks ?? getRemoteJwks(config.clientId), {
      issuer,
      algorithms: ["RS256"],
      clockTolerance: 5,
    });
    assertTokenBinding(payload, config);
    return sessionFromClaims(payload);
  } catch (error) {
    if (error instanceof TokenVerifyError) throw error;
    if (error instanceof Error) {
      throw new TokenVerifyError(mapJoseError(error), error.message);
    }
    throw new TokenVerifyError("invalid_token");
  }
}

/**
 * Bind the token to this WorkOS application.
 * - If `aud` is present (JWT template / Connect / multi-app): it must include `config.audience`.
 * - If `aud` is absent (default AuthKit session token):
 *   - mismatched `client_id` fails closed
 *   - missing `client_id` is OK when `audience === clientId` — jose already verified
 *     the signature against JWKS for this `WORKOS_CLIENT_ID`
 * - If ops configured a custom audience (`audience !== clientId`) but the token
 *   has no `aud`, fail closed — clear sticky `WORKOS_TOKEN_AUDIENCE` or add a JWT template.
 */
export function assertTokenBinding(payload: JWTPayload, config: WorkOSTokenVerifyConfig): void {
  if (payload.aud !== undefined) {
    const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!audiences.includes(config.audience)) {
      throw new TokenVerifyError("claim_aud", "Access token audience does not match.");
    }
    return;
  }

  if (config.audience !== config.clientId) {
    throw new TokenVerifyError(
      "claim_aud",
      "Access token is missing audience; configure a WorkOS JWT template or clear WORKOS_TOKEN_AUDIENCE.",
    );
  }

  const clientId = z.string().min(1).safeParse(payload.client_id);
  // Official AuthKit session tokens include `client_id`. Some live tokens omit it
  // while still signing with this client's JWKS — accept after signature/iss/exp.
  if (!clientId.success) return;
  if (clientId.data !== config.clientId) {
    throw new TokenVerifyError("claim_client_id", "Access token client_id does not match.");
  }
}

function readOrganizationId(payload: JWTPayload): string | null {
  const orgId = z.string().min(1).safeParse(payload.org_id);
  if (orgId.success) return orgId.data;
  const organizationId = z.string().min(1).safeParse(payload.organization_id);
  if (organizationId.success) return organizationId.data;
  const orgObject = orgObjectSchema.safeParse(payload.org);
  return orgObject.success ? orgObject.data.id : null;
}

function mapJoseError(error: Error): TokenVerifyFailureCode {
  if (error instanceof errors.JWTExpired) return "expired";
  if (error instanceof errors.JWSSignatureVerificationFailed) return "bad_signature";
  if (error instanceof errors.JWKSNoMatchingKey) return "unknown_kid";
  if (error instanceof errors.JWTClaimValidationFailed) return claimFailure(error.claim);
  if (isJwksTimeout(error)) return "verification_unavailable";
  return "invalid_token";
}

function claimFailure(claim: string): TokenVerifyFailureCode {
  if (claim === "aud") return "claim_aud";
  if (claim === "iss") return "claim_iss";
  if (claim === "sub") return "claim_sub";
  if (claim === "client_id") return "claim_client_id";
  return "invalid_token";
}

function isJwksTimeout(error: Error): boolean {
  return z.object({ code: z.literal("ERR_JWKS_TIMEOUT") }).safeParse(error).success;
}

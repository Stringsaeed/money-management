import { createRemoteJWKSet, errors, jwtVerify, type JWTPayload, type JWTVerifyGetKey } from "jose";
import { z } from "zod";

import type { AuthSession, AuthUser, WorkOSTokenVerifyConfig } from "./session";

export type TokenVerifyFailureCode =
  | "missing_token"
  | "expired"
  | "bad_signature"
  | "unknown_kid"
  | "claim_aud"
  | "claim_iss"
  | "claim_sub"
  | "invalid_token"
  | "verification_unavailable";

export class TokenVerifyError extends Error {
  readonly code: TokenVerifyFailureCode;

  constructor(code: TokenVerifyFailureCode, message?: string) {
    super(message ?? code);
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
    const { payload } = await jwtVerify(token, config.jwks ?? getRemoteJwks(config.clientId), {
      issuer,
      audience: config.audience,
      algorithms: ["RS256"],
      clockTolerance: 5,
    });
    return sessionFromClaims(payload);
  } catch (error) {
    if (error instanceof TokenVerifyError) throw error;
    if (error instanceof Error) {
      throw new TokenVerifyError(mapJoseError(error), error.message);
    }
    throw new TokenVerifyError("invalid_token");
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
  return "invalid_token";
}

function isJwksTimeout(error: Error): boolean {
  return z.object({ code: z.literal("ERR_JWKS_TIMEOUT") }).safeParse(error).success;
}

/**
 * Canonical WorkOS identity contract for API and PowerSync token issuance.
 *
 * - `user.id` is the WorkOS User id (`sub` / `user_…`).
 * - `organizationId` is optional. Personal authentication works with `null`.
 * - Callers must never treat a client-supplied User or organization id as proof
 *   of access; only verified bearer claims populate this shape.
 */
export interface AuthUser {
  readonly id: string;
  readonly email: string;
  readonly name: string;
}

export interface AuthSession {
  readonly user: AuthUser;
  readonly organizationId: string | null;
  readonly sessionId: string | null;
}

export interface WorkOSTokenVerifyConfig {
  readonly clientId: string;
  readonly audience: string;
  readonly issuer: string;
  /** Injected JWKS for tests; production uses WorkOS remote JWKS. */
  readonly jwks?: import("jose").JWTVerifyGetKey;
}

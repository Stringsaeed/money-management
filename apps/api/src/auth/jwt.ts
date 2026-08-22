/**
 * JWT verification against Supabase's JWKS endpoint.
 *
 * Supabase issues asymmetric (ES256/RS256) access tokens; the public keys are
 * published at `{SUPABASE_URL}/auth/v1/.well-known/jwks.json`. `createRemoteJWKSet`
 * fetches and caches that key set, re-fetching on unknown `kid`s so key rotation
 * is picked up without restarts.
 *
 * Imports stay relative: this service compiles with plain `tsc` (Node16 resolution)
 * and runs from `dist/`, where path aliases would need extra runtime wiring.
 *
 * We verify signature, expiry and issuer. Audience is deliberately not pinned:
 * Supabase tokens carry `aud: "authenticated"` today, but the claim's value has
 * changed across Supabase versions and nothing here depends on it.
 */
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

import { parseHouseholdRoles, supabaseIssuer } from "../config.js";
import type { AuthContext } from "../types.js";

export interface JwtVerifier {
  verify(token: string): Promise<AuthContext>;
}

export function createJwtVerifier(options: { supabaseUrl: string; jwksUrl?: string }): JwtVerifier {
  const issuer = supabaseIssuer(options.supabaseUrl);
  const jwksUri = options.jwksUrl ?? `${issuer}/.well-known/jwks.json`;
  const remoteJwks = createRemoteJWKSet(new URL(jwksUri));

  return {
    async verify(token: string): Promise<AuthContext> {
      const { payload } = await jwtVerify(token, remoteJwks, { issuer });
      return toAuthContext(payload);
    },
  };
}

/** Extracts household/role claims stamped by the custom access token hook into request-context shape. */
export function toAuthContext(payload: JWTPayload): AuthContext {
  if (typeof payload.sub !== "string" || payload.sub.length === 0)
    throw new Error("Token payload is missing a usable `sub` claim.");

  const activeHouseholdId =
    typeof payload.active_household_id === "string" ? payload.active_household_id : null;

  return {
    userId: payload.sub,
    householdRoles: parseHouseholdRoles(payload.household_roles),
    activeHouseholdId,
  };
}

/**
 * Auth middleware: verifies the bearer token and injects claims into context.
 *
 * Every route mounted after this middleware can read `c.var.auth` (userId,
 * householdRoles, activeHouseholdId). Missing/malformed/invalid tokens are
 * rejected with a uniform 401 before any handler runs.
 */
import type { MiddlewareHandler } from "hono";

import type { ApiEnv } from "../types.js";
import type { JwtVerifier } from "./jwt.js";

export function requireAuth(verifier: JwtVerifier): MiddlewareHandler<ApiEnv> {
  return async (c, next) => {
    const authorization = c.req.header("Authorization");
    const token = authorization?.startsWith("Bearer ")
      ? authorization.slice("Bearer ".length)
      : undefined;

    if (!token)
      return c.json(
        { error: "unauthorized", message: "Missing Authorization header with a Bearer token." },
        401,
      );

    try {
      c.set("auth", await verifier.verify(token));
    } catch {
      // Verification failures (bad signature, expired, wrong issuer, malformed) all
      // collapse into one response so we never leak why a token was rejected.
      return c.json({ error: "unauthorized", message: "Invalid or expired access token." }, 401);
    }

    await next();
  };
}

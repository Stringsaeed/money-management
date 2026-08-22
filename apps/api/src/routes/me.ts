/**
 * GET /me — authenticated debug/identity route.
 *
 * Echoes the verified claims back so clients (and tests) can confirm token
 * verification end-to-end. Will be superseded by /commands and /sync; kept
 * until then as the canonical example of reading `c.var.auth`.
 */
import { Hono } from "hono";

import type { ApiEnv } from "../types.js";

export function meRoutes(): Hono<ApiEnv> {
  const routes = new Hono<ApiEnv>();

  routes.get("/me", (c) => {
    const { userId, householdRoles, activeHouseholdId } = c.var.auth;
    return c.json({
      userId,
      householdRoles,
      activeHouseholdId,
    });
  });

  return routes;
}

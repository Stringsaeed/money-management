/**
 * GET /health — liveness/readiness probe for load balancers and container runtimes.
 * Intentionally unauthenticated and dependency-free: it reports whether THIS
 * process is up, not whether its dependencies are.
 */
import { Hono } from "hono";

import type { ApiEnv } from "../types.js";

export function healthRoutes(): Hono<ApiEnv> {
  const routes = new Hono<ApiEnv>();

  routes.get("/health", (c) =>
    c.json({
      status: "ok",
      service: "trove-api",
      timestamp: new Date().toISOString(),
    }),
  );

  return routes;
}

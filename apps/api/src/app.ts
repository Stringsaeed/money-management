/**
 * App factory: assembles middleware and routes.
 *
 * Kept separate from the `serve` bootstrap so tests can drive the full stack
 * (real JWKS verification included) via `app.request` without binding a port.
 */
import { Hono } from "hono";
import { logger } from "hono/logger";

import { requireAuth } from "./auth/middleware.js";
import type { JwtVerifier } from "./auth/jwt.js";
import { healthRoutes } from "./routes/health.js";
import { meRoutes } from "./routes/me.js";
import type { ApiEnv } from "./types.js";

export function createApp(options: { jwtVerifier: JwtVerifier }): Hono<ApiEnv> {
  const app = new Hono<ApiEnv>();

  app.use(logger());

  app.route("/", healthRoutes());
  app.use("*", requireAuth(options.jwtVerifier));
  app.route("/", meRoutes());

  app.onError((error, c) => {
    console.error("Unhandled error:", error);
    return c.json({ error: "internal", message: "Unexpected server error. Retry shortly." }, 500);
  });

  return app;
}

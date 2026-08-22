/**
 * apps/api bootstrap: parse config, build the app, serve over HTTP.
 */
import { serve } from "@hono/node-server";

import { createApp } from "./app.js";
import { createJwtVerifier } from "./auth/jwt.js";
import { parseConfig, supabaseIssuer } from "./config.js";

const config = parseConfig();
const app = createApp({ jwtVerifier: createJwtVerifier(config) });

const server = serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(
    `trove-api listening on http://localhost:${info.port} (issuer ${supabaseIssuer(config.supabaseUrl)})`,
  );
});

function shutdown(signal: string): void {
  console.log(`Received ${signal}, shutting down.`);
  server.close(() => process.exit(0));
  // Containers get SIGTERM with a grace period; fall back hard if connections linger.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

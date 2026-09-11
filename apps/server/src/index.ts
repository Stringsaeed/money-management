import { createContext } from "@trove/api/context";
import { createSettlementIdentity, settleDueRules } from "@trove/api/lib/recurring/scheduler";
import { createPowerSyncJwksResponse } from "@trove/api/lib/powersync/jwks";
import { createDb, withDbScope } from "@trove/db";
import { appRouter } from "@trove/api/routers/index";
import { env, getPowerSyncServerConfig } from "@trove/env/server";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { appLinks } from "./app-links";
import { memberWidget } from "./member-widget";
import { workosWebhooks } from "./workos-webhooks";

const app = new Hono();

app.use(logger());
app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.route("/", appLinks);
app.route("/", memberWidget);
app.route("/", workosWebhooks);

app.get("/api/powersync/jwks.json", () => createPowerSyncJwksResponse(getPowerSyncServerConfig()));

export const rpcHandler = new RPCHandler(appRouter, {
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

app.use("/*", async (c, next) => {
  const context = await createContext({ context: c });

  const rpcResult = await rpcHandler.handle(c.req.raw, {
    prefix: "/rpc",
    context: context,
  });

  if (rpcResult.matched) {
    return c.newResponse(rpcResult.response.body, rpcResult.response);
  }

  await next();
});

app.get("/", (c) => {
  return c.text("OK");
});

/**
 * Hourly Cron Trigger entry (#88): settles every active Recurring Rule on
 * its own time zone's local date. Idempotent under Cron retries — the
 * occurrence identity PK absorbs double-settlement and the rule revision
 * assertion aborts commits racing a concurrent edit.
 */
export async function scheduled(controller: ScheduledController) {
  const summary = await settleDueRules(
    createDb(),
    createSettlementIdentity(),
    new Date(controller.scheduledTime),
  );
  console.log(
    `Settlement sweep: ${summary.generatedCount} transaction(s), ` +
      `${summary.totalMinor} minor across ${summary.households} household(s).`,
  );
}

export default {
  fetch: (request: Request, env: {}, ctx: ExecutionContext) =>
    withDbScope(() => Promise.resolve(app.fetch(request, env, ctx)), ctx),
  scheduled: (controller: ScheduledController, _env: {}, ctx: ExecutionContext) =>
    withDbScope(() => scheduled(controller), ctx),
};

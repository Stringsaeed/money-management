import { createContext } from "@trove/api/context";
import { createSettlementIdentity, settleDueRules } from "@trove/api/lib/recurring/scheduler";
import { handleHouseholdPushUpgrade } from "@trove/api/lib/push/upgrade";
import { HouseholdPushDO } from "@trove/api/lib/push/household-push-do";
import { createDb } from "@trove/db";
import { appRouter } from "@trove/api/routers/index";
import { env } from "@trove/env/server";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { auth } from "./auth";

const app = new Hono();

app.use(logger());
app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "Cookie"],
    credentials: true,
  }),
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

export const rpcHandler = new RPCHandler(appRouter, {
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

app.use("/*", async (c, next) => {
  const context = await createContext({ context: c, auth });

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
 * Realtime push upgrade (#93): session + household membership are checked on
 * the Worker, then the request is handed to the household's Durable Object,
 * which holds that household's WebSocket subscriptions. Best-effort channel —
 * clients fall back to polling when this is unavailable.
 */
app.get("/api/push/household/:householdId", (c) =>
  handleHouseholdPushUpgrade(
    { getSession: auth.api.getSession, db: createDb(), namespace: env.PUSH_HOUSEHOLD_DO },
    c.req.raw,
    c.req.param("householdId"),
  ),
);

/**
 * The per-household push Durable Object (#93). Exported from the worker entry
 * so the PUSH_HOUSEHOLD_DO binding resolves to this module.
 */
export { HouseholdPushDO };

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
  fetch: app.fetch,
  scheduled,
};

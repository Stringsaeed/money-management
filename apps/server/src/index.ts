import { createContext } from "@trove/api/context";
import { createSettlementIdentity, settleDueRules } from "@trove/api/lib/recurring/scheduler";
import { createPowerSyncJwksResponse } from "@trove/api/lib/powersync/jwks";
import { formatOrpcErrorLog } from "@trove/api/orpc-error-log";
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
import { v2Routes } from "./v2";
import { settleV2DueRules } from "@trove/api/v2/recurring";

const app = new Hono();

app.use(logger());
app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "Idempotency-Key",
      "If-Match",
      "X-Trove-Guest-Token",
    ],
    credentials: true,
  }),
);

app.route("/", appLinks);
app.route("/", memberWidget);
app.route("/", workosWebhooks);
app.route("/api/v2", v2Routes);

app.get("/api/powersync/jwks.json", () => createPowerSyncJwksResponse(getPowerSyncServerConfig()));

export const rpcHandler = new RPCHandler(appRouter, {
  interceptors: [
    onError((error) => {
      // Plain string — CF Observability often shows raw Error as stack-only.
      const logged = error instanceof Error ? error : new Error(String(error));
      console.error(formatOrpcErrorLog(logged));
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
  const results = await Promise.allSettled([settleLegacy(controller), settleNext(controller)]);
  if (results[0]?.status === "rejected") console.error("Legacy recurring settlement failed.");
  if (results[1]?.status === "rejected") console.error("V2 recurring settlement failed.");
  if (results.some((result) => result.status === "rejected")) {
    // Give each version its own chance to settle even when the other fails.
    throw new Error("A recurring settlement sweep failed. Check legacy and V2 sweep logs.");
  }
}

async function settleLegacy(controller: ScheduledController) {
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

async function settleNext(controller: ScheduledController) {
  const nextSummary = await settleV2DueRules(createDb(), new Date(controller.scheduledTime));
  console.log(
    `V2 settlement: ${nextSummary.generatedCount} transaction(s) across ${nextSummary.ledgers} ledger(s).`,
  );
}

export default {
  fetch: (request: Request, env: {}, ctx: ExecutionContext) =>
    withDbScope(() => Promise.resolve(app.fetch(request, env, ctx)), ctx),
  scheduled: (controller: ScheduledController, _env: {}, ctx: ExecutionContext) =>
    withDbScope(() => scheduled(controller), ctx),
};

import { createWorkOSHouseholdDirectory } from "@trove/auth";
import { createV2Api } from "@trove/api/v2/app";
import { claimGuestLedgerInTransaction } from "@trove/api/v2/guest-claim";
import { createDb } from "@trove/db";
import { env } from "@trove/env/server";
import { Hono } from "hono";

export const v2Routes = new Hono();

v2Routes.all("/*", async (context) => {
  // Construct request-owned DB dependencies within withDbScope in the Worker entry.
  const api = new Hono().route(
    "/api/v2",
    createV2Api({
      db: createDb(),
      workos: env,
      directory: createWorkOSHouseholdDirectory(env.WORKOS_API_KEY),
      claimGuestLedger: claimGuestLedgerInTransaction,
      market: {
        keys: {
          stocks: env.MARKET_STOCKS_API_KEY,
          metals: env.MARKET_METALS_API_KEY,
          crypto: env.MARKET_CRYPTO_API_KEY,
        },
        getCache: () => caches.default,
      },
    }),
  );
  return api.fetch(context.req.raw, context.env, context.executionCtx);
});

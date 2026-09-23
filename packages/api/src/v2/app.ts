import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { ZodError } from "zod";
import { createV2AuthRoutes, resolveV2Principal, type V2AuthRoutesDeps } from "./auth-routes";
import { requireUserPrincipal, v2AuthErrorResponse } from "./auth";
import { createV2HouseholdRoutes } from "./household-routes";
import { authorizeV2Household, type V2HouseholdDeps } from "./households";
import { createV2LedgerRoutes } from "./ledger-routes";
import { createMarketRoutes, type MarketRouteDependencies } from "./market";
import { V2ApiError } from "./shared";

export interface V2ApiDependencies extends V2AuthRoutesDeps, V2HouseholdDeps {
  readonly market: MarketRouteDependencies;
}

export function createV2Api(dependencies: V2ApiDependencies) {
  const app = new Hono();
  app.use("*", bodyLimit({ maxSize: 64 * 1024 }));
  app.onError((error) => {
    if (error instanceof ZodError) {
      return Response.json(
        { error: { code: "invalid_input", message: "Check the supplied fields and try again." } },
        { status: 400 },
      );
    }
    if (error instanceof V2ApiError) {
      return Response.json(
        { error: { code: error.code, message: error.message } },
        { status: error.status },
      );
    }
    const response = v2AuthErrorResponse(error);
    return Response.json(response.body, { status: response.status });
  });
  app.get("/health", (context) => context.json({ version: 2, status: "ok" }));
  app.route("/auth", createV2AuthRoutes(dependencies));
  app.route("/households", createV2HouseholdRoutes(dependencies));
  app.use("/market", async (context, next) => {
    await resolveV2Principal(context.req.raw, dependencies);
    await next();
  });
  app.route("/", createMarketRoutes(dependencies.market));
  app.route(
    "/",
    createV2LedgerRoutes({
      db: dependencies.db,
      getPrincipal: (context) => resolveV2Principal(context.req.raw, dependencies),
      authorizeHousehold: async (principal, householdId, access) => {
        const user = requireUserPrincipal(principal);
        await authorizeV2Household(dependencies, {
          userId: user.userId,
          householdId,
          write: access === "write",
        });
      },
    }),
  );
  return app;
}

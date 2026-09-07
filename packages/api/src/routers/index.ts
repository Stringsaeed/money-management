import type { RouterClient } from "@orpc/server";

import { publicProcedure } from "../index";
import { activityRouter } from "./activity";
import { commandsRouter } from "./commands";
import { householdsRouter } from "./households";
import { ledgerRouter } from "./ledger";
import { migrationRouter } from "./migration";
import { powersyncRouter } from "./powersync";
import { syncRouter } from "./sync";

export const appRouter = {
  healthCheck: publicProcedure.handler(() => {
    return "OK";
  }),
  households: householdsRouter,
  commands: commandsRouter,
  sync: syncRouter,
  activity: activityRouter,
  ledger: ledgerRouter,
  migration: migrationRouter,
  powersync: powersyncRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;

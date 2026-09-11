import type { RouterClient } from "@orpc/server";

import { publicProcedure } from "../index";
import { accountRouter } from "./account";
import { activityRouter } from "./activity";
import { budgetRouter } from "./budget";
import { commandsRouter } from "./commands";
import { householdsRouter } from "./households";
import { ledgerRouter } from "./ledger";
import { migrationRouter } from "./migration";
import { powersyncRouter } from "./powersync";
import { projectionsRouter } from "./projections";
import { syncRouter } from "./sync";

export const appRouter = {
  healthCheck: publicProcedure.handler(() => {
    return "OK";
  }),
  account: accountRouter,
  households: householdsRouter,
  commands: commandsRouter,
  sync: syncRouter,
  activity: activityRouter,
  budget: budgetRouter,
  ledger: ledgerRouter,
  migration: migrationRouter,
  powersync: powersyncRouter,
  projections: projectionsRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;

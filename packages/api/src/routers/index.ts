import type { RouterClient } from "@orpc/server";

import { protectedProcedure, publicProcedure } from "../index";
import { budgetRouter } from "./budget";
import { commandsRouter } from "./commands";
import { householdsRouter } from "./households";
import { syncRouter } from "./sync";

export const appRouter = {
  healthCheck: publicProcedure.handler(() => {
    return "OK";
  }),
  privateData: protectedProcedure.handler(({ context }) => {
    return {
      message: "This is private",
      user: context.session?.user,
    };
  }),
  households: householdsRouter,
  commands: commandsRouter,
  sync: syncRouter,
  budget: budgetRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;

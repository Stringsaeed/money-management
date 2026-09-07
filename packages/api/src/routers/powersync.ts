import { getPowerSyncServerConfig } from "@trove/env/server";

import { protectedProcedure } from "../index";
import { signPowerSyncToken } from "../lib/powersync/token";
import { requireUserId } from "../lib/require-user";

export const powersyncRouter = {
  token: protectedProcedure.handler(async ({ context }) => {
    const config = getPowerSyncServerConfig();
    return {
      endpoint: config.audience,
      token: await signPowerSyncToken({
        ...config,
        userId: requireUserId(context),
      }),
    };
  }),
};

import { getPowerSyncServerConfig } from "@trove/env/server";

import { protectedProcedure } from "../index";
import { createHouseholdDeps } from "../lib/households/deps";
import {
  TOKEN_RECONCILE_MAX_AGE_MS,
  reconcileUserMembershipsIfStale,
} from "../lib/membership/reconcile";
import { signPowerSyncToken } from "../lib/powersync/token";
import { requireUserId } from "../lib/require-user";

export const powersyncRouter = {
  /**
   * Sync Stream access is decided by the Membership projection at stream
   * evaluation time, so a stale projection is refreshed here before a new
   * token extends the session. With webhooks missed entirely, this bounds
   * revocation to one token lifetime plus the refresh window.
   */
  token: protectedProcedure.handler(async ({ context }) => {
    const userId = requireUserId(context);
    const config = getPowerSyncServerConfig();
    try {
      await reconcileUserMembershipsIfStale(
        createHouseholdDeps(),
        userId,
        TOKEN_RECONCILE_MAX_AGE_MS,
      );
    } catch (error) {
      // The projection keeps serving its last verified state; a WorkOS outage
      // must not take sync down with it.
      console.error("powersync.token: membership reconcile skipped", { userId, error });
    }
    return {
      endpoint: config.audience,
      token: await signPowerSyncToken({
        ...config,
        userId,
      }),
    };
  }),
};

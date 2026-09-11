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
    // If a stale projection cannot be refreshed, fail closed instead of
    // extending potentially-revoked Household access with a fresh token.
    await reconcileUserMembershipsIfStale(
      createHouseholdDeps(),
      userId,
      TOKEN_RECONCILE_MAX_AGE_MS,
    );
    return {
      endpoint: config.audience,
      token: await signPowerSyncToken({
        ...config,
        userId,
      }),
    };
  }),
};

import { env } from "@trove/env/server";

import { protectedProcedure } from "../index";
import { isKillSwitchEngaged } from "../lib/observability/kill-switch";

export const syncRouter = {
  /** Client-facing kill-switch probe retained for PowerSync upload gating. */
  status: protectedProcedure.handler(() => ({
    killSwitchLocalOnly: isKillSwitchEngaged(env.KILL_SWITCH_LOCAL_ONLY),
  })),
};

import { createDb } from "@trove/db";
import { env } from "@trove/env/server";

import { protectedProcedure } from "../index";
import { instrumentCommandApply } from "../lib/observability/metrics";
import { requestMetrics } from "../lib/observability/runtime";
import { isKillSwitchEngaged, LOCAL_ONLY_RESULT } from "../lib/observability/kill-switch";
import { applyCommand } from "../lib/commands/pipeline";
import { commandEnvelopeSchema } from "../lib/commands/schema";
import { createHouseholdChangePublisher, isPushNamespace } from "../lib/push/publisher";
import { requireUserId } from "../lib/require-user";

const workerBindings: object = env;
const pushHouseholdBinding = Reflect.get(workerBindings, "PUSH_HOUSEHOLD_DO");
const householdChangePublisher = createHouseholdChangePublisher(
  isPushNamespace(pushHouseholdBinding) ? pushHouseholdBinding : undefined,
);

export const commandsRouter = {
  /**
   * The single write path for synced clients: one command in, one
   * discriminated result plus recomputed state out. Retries are free — the
   * same `commandId` replays the stored result. Committed changes also ping
   * the household's push channel (#93), best-effort only.
   *
   * When the remote `kill_switch_local_only` flag is engaged (#99) nothing is
   * applied: every command gets the typed `local_only` result so clients keep
   * it queued and stay in local-only mode.
   */
  apply: protectedProcedure.input(commandEnvelopeSchema).handler(async ({ context, input }) => {
    const userId = requireUserId(context);
    if (isKillSwitchEngaged(env.KILL_SWITCH_LOCAL_ONLY)) {
      requestMetrics().record({ event: "kill_switch_engaged" });
      return LOCAL_ONLY_RESULT;
    }
    const db = createDb();
    return instrumentCommandApply(requestMetrics(), () =>
      applyCommand({
        db,
        userId,
        envelope: input,
        publishChange: householdChangePublisher,
        waitUntil: context.waitUntil,
      }),
    );
  }),
};

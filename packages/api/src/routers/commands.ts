import { createDb } from "@trove/db";
import { env } from "@trove/env/server";

import { protectedProcedure } from "../index";
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
   */
  apply: protectedProcedure.input(commandEnvelopeSchema).handler(async ({ context, input }) => {
    const userId = requireUserId(context);
    const db = createDb();
    return applyCommand({
      db,
      userId,
      envelope: input,
      publishChange: householdChangePublisher,
      waitUntil: context.waitUntil,
    });
  }),
};

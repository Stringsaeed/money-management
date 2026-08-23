import { createDb } from "@trove/db";

import { protectedProcedure } from "../index";
import { applyCommand } from "../lib/commands/pipeline";
import { commandEnvelopeSchema } from "../lib/commands/schema";
import { requireUserId } from "../lib/require-user";

export const commandsRouter = {
  /**
   * The single write path for synced clients: one command in, one
   * discriminated result plus recomputed state out. Retries are free — the
   * same `commandId` replays the stored result.
   */
  apply: protectedProcedure.input(commandEnvelopeSchema).handler(async ({ context, input }) => {
    const userId = requireUserId(context);
    const db = createDb();
    return applyCommand({ db, userId, envelope: input });
  }),
};

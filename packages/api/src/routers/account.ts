import { z } from "zod";

import { protectedProcedure } from "../index";
import { requestUserDeletion } from "../lib/deletion/service";
import { createHouseholdDeps } from "../lib/households/deps";
import { requireUserId } from "../lib/require-user";

/**
 * Account lifecycle for the signed-in User. Household deletion stays on the
 * households router; this surface owns identity deletion (#230).
 */
export const accountRouter = {
  delete: protectedProcedure
    .input(z.object({ confirm: z.literal(true) }))
    .handler(async ({ context }) => {
      await requestUserDeletion(createHouseholdDeps(), {
        userId: requireUserId(context),
      });
      return { ok: true } as const;
    }),
};

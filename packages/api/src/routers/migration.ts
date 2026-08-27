import { createDb } from "@trove/db";
import { z } from "zod";

import { protectedProcedure } from "../index";
import { requireUserId } from "../lib/require-user";
import { requireHouseholdMember } from "../lib/require-member";
import { computeImportManifest } from "../lib/migration/manifest";

export const migrationRouter = {
  /**
   * Recomputes the import integrity manifest from this household's
   * currently-imported rows (#98), for the client to compare against its own
   * pre-import computation once every `import_bundle` chunk has landed.
   */
  getManifest: protectedProcedure
    .input(z.object({ householdId: z.string().min(1) }))
    .handler(async ({ context, input }) => {
      const userId = requireUserId(context);
      const db = createDb();
      await requireHouseholdMember(db, userId, input.householdId);
      return computeImportManifest(db, input.householdId);
    }),
};

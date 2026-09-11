import { createDb } from "@trove/db";
import { personalLedgerId } from "@trove/protocol";
import { z } from "zod";

import { protectedProcedure } from "../index";
import { requireUserId } from "../lib/require-user";
import { requireHouseholdMember } from "../lib/require-member";
import { computeImportManifest } from "../lib/migration/manifest";

const getManifestInput = z.union([
  z.object({ householdId: z.string().min(1) }),
  z.object({ scope: z.literal("personal") }),
]);

export const migrationRouter = {
  /**
   * Recomputes the import integrity manifest from this ledger's
   * currently-imported rows (#98 / #229), for the client to compare against its own
   * pre-import computation once every `import_bundle` chunk has landed.
   */
  getManifest: protectedProcedure.input(getManifestInput).handler(async ({ context, input }) => {
    const userId = requireUserId(context);
    const db = createDb();
    if ("scope" in input) {
      return computeImportManifest(db, personalLedgerId(userId));
    }
    await requireHouseholdMember(db, userId, input.householdId);
    return computeImportManifest(db, input.householdId);
  }),
};

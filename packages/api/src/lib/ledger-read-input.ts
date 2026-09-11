import { z } from "zod";

import { commandScopeSchema } from "./commands/schema";

/**
 * Read RPCs accept either an explicit scope or a legacy householdId, the
 * same wire contract commands.apply already uses.
 */
export const ledgerReadFields = z.object({
  householdId: z.string().min(1).optional(),
  scope: commandScopeSchema.optional(),
});

export const ledgerReadInput = ledgerReadFields.refine(
  (input) => input.scope !== undefined || input.householdId !== undefined,
  {
    message: "Name the ledger this read belongs to: a personal or organization scope.",
    path: ["scope"],
  },
);

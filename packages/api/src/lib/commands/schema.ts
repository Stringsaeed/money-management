import { COMMAND_KINDS } from "@trove/protocol";
import { z } from "zod";

/**
 * Wire schema for a command envelope posted to `commands.apply`.
 * Payloads stay opaque here — each handler owns its payload schema.
 */
export const preconditionSchema = z.object({
  entityId: z.string().min(1).optional(),
  expectedVersion: z.number().int().nonnegative().optional(),
  predicate: z.string().min(1).optional(),
  args: z.record(z.string(), z.unknown()).optional(),
});

export const commandEnvelopeSchema = z.object({
  commandId: z.uuid(),
  householdId: z.string().min(1),
  kind: z.enum(COMMAND_KINDS),
  payload: z.unknown(),
  preconditions: z.array(preconditionSchema).max(20).optional(),
  issuedAt: z.iso.datetime().optional(),
});

export type CommandEnvelopeInput = z.infer<typeof commandEnvelopeSchema>;

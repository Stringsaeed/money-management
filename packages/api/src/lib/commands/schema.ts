import { z } from "zod";

/**
 * Wire schema for a command envelope posted to `commands.apply`.
 * Payloads stay opaque here — each handler owns its payload schema.
 * `kind` is a non-empty string so removed or unknown kinds reach the
 * pipeline and return typed `invalid_intent` instead of Zod 400s.
 */
export const preconditionSchema = z.object({
  entityId: z.string().min(1).optional(),
  expectedVersion: z.number().int().nonnegative().optional(),
  predicate: z.string().min(1).optional(),
  args: z.record(z.string(), z.unknown()).optional(),
});

/**
 * The Ledger Scope a command writes to. A personal scope names no owner: the
 * server binds it to the authenticated User, so the wire can never carry a
 * request to write into somebody else's Personal Ledger.
 */
export const commandScopeSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("personal") }),
  z.object({ type: z.literal("organization"), organizationId: z.string().min(1) }),
]);

export const commandEnvelopeSchema = z
  .object({
    commandId: z.uuid(),
    scope: commandScopeSchema.optional(),
    /** Retained for clients predating `scope`; read as an organization scope. */
    householdId: z.string().min(1).optional(),
    kind: z.string().min(1),
    payload: z.unknown(),
    preconditions: z.array(preconditionSchema).max(20).optional(),
    issuedAt: z.iso.datetime().optional(),
  })
  .refine((envelope) => envelope.scope !== undefined || envelope.householdId !== undefined, {
    message: "Name the ledger this command writes to: a personal or organization scope.",
    path: ["scope"],
  });

export type CommandEnvelopeInput = z.infer<typeof commandEnvelopeSchema>;

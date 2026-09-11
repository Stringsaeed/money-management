import { COMMAND_KINDS, type CommandEnvelope } from "@trove/protocol";
import { z } from "zod";

const preconditionSchema = z.object({
  entityId: z.string().optional(),
  expectedVersion: z.number().int().nonnegative().optional(),
  predicate: z.string().optional(),
  args: z.record(z.string(), z.unknown()).optional(),
});

const commandScopeSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("personal") }),
  z.object({ type: z.literal("organization"), organizationId: z.string().min(1) }),
]);

const commandEnvelopeSchema = z
  .object({
    commandId: z.string().min(1),
    scope: commandScopeSchema.optional(),
    householdId: z.string().min(1).optional(),
    kind: z.enum(COMMAND_KINDS),
    payload: z.unknown(),
    preconditions: z.array(preconditionSchema).optional(),
    issuedAt: z.string().optional(),
  })
  .refine((envelope) => envelope.scope !== undefined || envelope.householdId !== undefined, {
    message: "Name the ledger this command writes to: a personal or organization scope.",
    path: ["scope"],
  });

const commandMetadataSchema = z
  .object({
    storageVersion: z.literal(1),
    commandId: z.string().min(1),
    envelope: commandEnvelopeSchema,
  })
  .refine((metadata) => metadata.commandId === metadata.envelope.commandId);

export const serializeCommandMetadata = (envelope: CommandEnvelope): string =>
  JSON.stringify(commandMetadataFor(envelope));

export interface CommandMetadata extends Record<string, unknown> {
  readonly storageVersion: 1;
  readonly commandId: string;
  readonly envelope: CommandEnvelope;
}

export const commandMetadataFor = (envelope: CommandEnvelope): CommandMetadata => ({
  storageVersion: 1,
  commandId: envelope.commandId,
  envelope,
});

export const parseCommandMetadata = (metadata?: string | null): CommandEnvelope | null => {
  if (!metadata) return null;
  let decoded: unknown;
  try {
    decoded = JSON.parse(metadata);
  } catch {
    return null;
  }
  const parsed = commandMetadataSchema.safeParse(decoded);
  return parsed.success ? parsed.data.envelope : null;
};

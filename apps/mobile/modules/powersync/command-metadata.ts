import { COMMAND_KINDS, type CommandEnvelope } from "@trove/protocol";
import { z } from "zod";

const preconditionSchema = z.object({
  entityId: z.string().optional(),
  expectedVersion: z.number().int().nonnegative().optional(),
  predicate: z.string().optional(),
  args: z.record(z.string(), z.unknown()).optional(),
});

const commandEnvelopeSchema = z.object({
  commandId: z.string().min(1),
  householdId: z.string().min(1),
  kind: z.enum(COMMAND_KINDS),
  payload: z.unknown(),
  preconditions: z.array(preconditionSchema).optional(),
  issuedAt: z.string().optional(),
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

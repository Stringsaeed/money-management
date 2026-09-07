import { parseISO } from "date-fns";
import type { CommandEnvelope, CommandKind, Precondition } from "@trove/protocol";
import { z } from "zod";

import { parseRejection, type RejectionResult } from "@/lib/sync/rejection";
import type { PowerSyncLedgerCollections } from "@/modules/ledger-db/collections";
import type { SyncedTransactionLedger } from "@/modules/ledger-db/ledger";
import { nowIso } from "@/utils/date";

import { commandMetadataFor, parseCommandMetadata } from "./command-metadata";

export interface RejectedChange {
  readonly commandId: string;
  readonly householdId: string;
  readonly kind: CommandKind | "unknown";
  readonly rejectionKind: string;
  readonly rejection: RejectionResult;
  readonly payload: unknown;
  readonly preconditions?: readonly Precondition[];
  readonly attempts: number;
  readonly createdAt: Date;
  readonly envelope?: CommandEnvelope;
}

const transactionEditPayloadSchema = z.object({
  transactionId: z.string().min(1),
  type: z.enum(["expense", "income", "transfer"]).optional(),
  amountMinor: z.number().int().positive().optional(),
  date: z.string().optional(),
  accountId: z.string().optional(),
  toAccountId: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  description: z.string().optional(),
});

export const listRejectedChanges = (
  collections: PowerSyncLedgerCollections,
  householdId: string,
): readonly RejectedChange[] =>
  collections.rejectedChanges.toArray
    .filter((row) => row.household_id === householdId)
    .map(rejectedChangeFrom)
    .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());

export const getRejectedChange = (
  collections: PowerSyncLedgerCollections,
  commandId: string,
): RejectedChange | null => {
  const row = collections.rejectedChanges.get(commandId);
  return row ? rejectedChangeFrom(row) : null;
};

export const discardRejectedChange = async (
  collections: PowerSyncLedgerCollections,
  commandId: string,
): Promise<void> => {
  await collections.rejectedChanges.delete(commandId).isPersisted.promise;
};

export const resubmitRejectedChange = async (
  ledger: SyncedTransactionLedger,
  change: RejectedChange,
  newCommandId: string,
  editedPayload?: CommandEnvelope["payload"],
): Promise<void> => {
  if (!change.envelope) {
    throw new Error("This rejected change has no valid command envelope and cannot be retried.");
  }
  if (change.envelope.kind !== "transaction.edit") {
    throw new Error("Retry this rejected change from its original ledger screen.");
  }
  const payload = transactionEditPayloadSchema.parse(editedPayload ?? change.payload);
  const current = ledger.collections.transactions.get(payload.transactionId);
  if (!current || current.household_id !== change.householdId) {
    throw new Error("The rejected Transaction is no longer in the authorized collection.");
  }
  const envelope: CommandEnvelope = {
    ...change.envelope,
    commandId: newCommandId,
    issuedAt: nowIso(),
    payload,
    preconditions: [{ entityId: payload.transactionId, expectedVersion: current.version }],
  };
  await ledger.collections.transactions.update(
    payload.transactionId,
    { metadata: commandMetadataFor(envelope) },
    (draft) => {
      if (payload.type !== undefined) draft.type = payload.type;
      if (payload.amountMinor !== undefined) draft.amount_minor = payload.amountMinor;
      if (payload.date !== undefined) draft.date = payload.date;
      if (payload.accountId !== undefined) draft.account_id = payload.accountId;
      if (payload.toAccountId !== undefined) draft.to_account_id = payload.toAccountId;
      if (payload.categoryId !== undefined) draft.category_id = payload.categoryId;
      if (payload.description !== undefined) draft.description = payload.description;
      draft.version = current.version + 1;
      draft.updated_by = ledger.userId;
      draft.updated_at = envelope.issuedAt ?? nowIso();
    },
  ).isPersisted.promise;
  await discardRejectedChange(ledger.collections, change.commandId);
};

const rejectedChangeFrom = (
  row: PowerSyncLedgerCollections["rejectedChanges"]["toArray"][number],
): RejectedChange => {
  const envelope = parseEnvelope(row.command_id, row.envelope);
  return {
    commandId: row.command_id,
    householdId: row.household_id,
    kind: envelope?.kind ?? "unknown",
    rejectionKind: row.rejection_kind,
    rejection: parseStoredRejection(row.rejection_payload),
    payload: envelope?.payload ?? null,
    ...(envelope?.preconditions && { preconditions: envelope.preconditions }),
    attempts: row.attempts,
    createdAt: parseISO(row.created_at),
    ...(envelope && { envelope }),
  };
};

const parseEnvelope = (commandId: string, serialized: string): CommandEnvelope | null => {
  let envelope: unknown;
  try {
    envelope = JSON.parse(serialized);
  } catch {
    return null;
  }
  return parseCommandMetadata(JSON.stringify({ storageVersion: 1, commandId, envelope }));
};

const parseStoredRejection = (serialized: string): RejectionResult => {
  try {
    return parseRejection(JSON.parse(serialized));
  } catch {
    return parseRejection({ kind: "invalid_intent", issues: [] });
  }
};

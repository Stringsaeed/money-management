import type {
  CommonPowerSyncDatabase,
  PowerSyncBackendConnector,
  PowerSyncCredentials,
} from "@powersync/react-native";
import type { CommandEnvelope, CommandResult } from "@trove/protocol";
import { commandLedgerId } from "@trove/protocol";

import { orpc } from "@/lib/server/orpc";
import { useSyncModeStore } from "@/stores/sync-mode-store";

import { parseCommandMetadata, serializeCommandMetadata } from "./command-metadata";

interface PowerSyncCrudEntry {
  readonly id: string;
  readonly table: string;
  readonly metadata?: string;
}

interface PowerSyncCrudTransaction {
  readonly crud: readonly PowerSyncCrudEntry[];
  readonly complete: () => Promise<void>;
}

export interface PowerSyncUploadDatabase {
  readonly getNextCrudTransaction: () => Promise<PowerSyncCrudTransaction | null>;
  readonly execute: (sql: string, parameters?: unknown[]) => Promise<PowerSyncExecuteResult>;
}

export interface PowerSyncExecuteResult {
  readonly rowsAffected?: number;
}

export interface PowerSyncUploadDependencies {
  readonly apply: (envelope: CommandEnvelope) => Promise<CommandResult>;
  readonly disconnect: () => Promise<void>;
  readonly setLocalOnly: (reason: "kill_switch") => void;
  /** The signed-in User, so a personal envelope resolves to its Ledger id. */
  readonly userId: string;
}

interface RejectedChangeInput {
  readonly commandId: string;
  readonly ledgerId: string;
  readonly kind: string;
  readonly result: CommandResult;
  readonly envelope: CommandEnvelope | null;
}

const INSERT_REJECTED_CHANGE = `
  INSERT OR REPLACE INTO rejected_changes (
    id, command_id, ledger_id, kind, rejection_kind,
    rejection_payload, envelope, attempts, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

export const processPowerSyncUpload = async (
  database: PowerSyncUploadDatabase,
  dependencies: PowerSyncUploadDependencies,
): Promise<void> => {
  const transaction = await database.getNextCrudTransaction();
  if (!transaction) return;

  const commands = new Map<string, CommandEnvelope>();
  const invalidCommandIds = new Set<string>();
  for (const entry of transaction.crud) {
    const envelope = parseCommandMetadata(entry.metadata);
    if (!envelope) {
      await writeRejectedChange(database, invalidMetadataRejection(entry));
      continue;
    }
    if (invalidCommandIds.has(envelope.commandId)) continue;
    const existing = commands.get(envelope.commandId);
    if (existing && serializeCommandMetadata(existing) !== serializeCommandMetadata(envelope)) {
      await writeRejectedChange(
        database,
        conflictingMetadataRejection(entry, envelope, dependencies.userId),
      );
      commands.delete(envelope.commandId);
      invalidCommandIds.add(envelope.commandId);
      continue;
    }
    commands.set(envelope.commandId, envelope);
  }

  for (const envelope of commands.values()) {
    const result = await dependencies.apply(envelope);
    if (result.kind === "applied") continue;
    if (result.kind === "local_only") {
      await dependencies.disconnect();
      dependencies.setLocalOnly("kill_switch");
      throw new Error("PowerSync upload paused by the remote kill switch.");
    }
    await writeRejectedChange(database, {
      commandId: envelope.commandId,
      ledgerId: rejectedLedgerId(envelope, dependencies.userId),
      kind: envelope.kind,
      result,
      envelope,
    });
  }

  await transaction.complete();
};

export const createPowerSyncConnector = (userId: string): PowerSyncBackendConnector => ({
  fetchCredentials: async (): Promise<PowerSyncCredentials> => orpc.powersync.token(),
  uploadData: async (database: CommonPowerSyncDatabase) =>
    processPowerSyncUpload(database, {
      apply: (envelope) =>
        orpc.commands.apply({
          ...envelope,
          preconditions: envelope.preconditions?.map((precondition) => ({ ...precondition })),
        }),
      disconnect: () => database.disconnect(),
      setLocalOnly: (reason) => useSyncModeStore.getState().setLocalOnly(reason),
      userId,
    }),
});

/** An envelope with neither scope nor household has no Ledger to file under. */
const rejectedLedgerId = (envelope: CommandEnvelope, userId: string): string =>
  commandLedgerId(envelope, userId) ?? "";

const writeRejectedChange = (
  database: PowerSyncUploadDatabase,
  input: RejectedChangeInput,
): Promise<PowerSyncExecuteResult> =>
  database.execute(INSERT_REJECTED_CHANGE, [
    input.commandId,
    input.commandId,
    input.ledgerId,
    input.kind,
    input.result.kind,
    JSON.stringify(input.result),
    input.envelope ? JSON.stringify(input.envelope) : "null",
    1,
    new Date().toISOString(),
  ]);

const invalidMetadataRejection = (entry: PowerSyncCrudEntry): RejectedChangeInput => ({
  commandId: `invalid-metadata:${entry.id}`,
  ledgerId: "",
  kind: "unknown",
  result: {
    kind: "invalid_intent",
    issues: [{ field: "metadata", message: `Missing command envelope for ${entry.table}.` }],
  },
  envelope: null,
});

const conflictingMetadataRejection = (
  entry: PowerSyncCrudEntry,
  envelope: CommandEnvelope,
  userId: string,
): RejectedChangeInput => ({
  commandId: envelope.commandId,
  ledgerId: rejectedLedgerId(envelope, userId),
  kind: envelope.kind,
  result: {
    kind: "invalid_intent",
    issues: [
      {
        field: "metadata.commandId",
        message: `Conflicting command envelopes include ${entry.table}:${entry.id}.`,
      },
    ],
  },
  envelope,
});

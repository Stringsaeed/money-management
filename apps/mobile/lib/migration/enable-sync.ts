import {
  manifestsMatch,
  type CommandEnvelope,
  type CommandResult,
  type ImportBundlePayload,
  type ImportManifest,
} from "@trove/protocol";

import { generateId } from "@/utils/id";

import { buildImportChunks } from "./chunks";
import type { ImportLedgerBinding } from "./import-binding";
import { computeLocalManifest, computeLocalManifestFromChunks, type LocalDb } from "./manifest";

/** Transport seam so the core stays testable without oRPC. */
export type SendImportCommand = (
  envelope: CommandEnvelope<ImportBundlePayload>,
) => Promise<CommandResult>;
export type FetchManifest = () => Promise<ImportManifest>;

export type ImportResult =
  | { status: "matched"; localManifest: ImportManifest; serverManifest: ImportManifest }
  | { status: "mismatched"; localManifest: ImportManifest; serverManifest: ImportManifest }
  | {
      status: "rejected";
      entityType: ImportBundlePayload["entityType"];
      chunkIndex: number;
      result: CommandResult;
    };

export interface RunImportArgs {
  db: LocalDb;
  binding: ImportLedgerBinding;
  sendCommand: SendImportCommand;
  fetchManifest: FetchManifest;
  connectAndWait?: () => Promise<void>;
}

function importEnvelope(
  binding: ImportLedgerBinding,
  chunk: ImportBundlePayload,
): CommandEnvelope<ImportBundlePayload> {
  const base = { commandId: generateId(), kind: "import_bundle" as const, payload: chunk };
  if (binding.kind === "personal") {
    return { ...base, scope: { type: "personal" as const } };
  }
  return { ...base, householdId: binding.householdId };
}

/**
 * The local-to-cloud migration's upload + verification core (#98 / #229): computes
 * the client's manifest, uploads every local row as dependency-ordered
 * `import_bundle` chunks, then compares against the server's post-import
 * recompute. Stops at the first rejected chunk instead of sending the rest.
 */
export async function runImport(args: RunImportArgs): Promise<ImportResult> {
  const { db, binding, sendCommand, fetchManifest } = args;
  const { ledgerId } = binding;
  const chunks = await buildImportChunks(db, ledgerId);
  const uploadManifest = await computeLocalManifestFromChunks(chunks);

  for (const chunk of chunks) {
    try {
      const result = await sendCommand(importEnvelope(binding, chunk));
      if (result.kind !== "applied") {
        return {
          status: "rejected",
          entityType: chunk.entityType,
          chunkIndex: chunk.chunkIndex,
          result,
        };
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : "upload failed";
      throw new Error(
        `Import paused while uploading "${chunk.entityType}" (chunk ${chunk.chunkIndex + 1}): ${reason}`,
      );
    }
  }

  await args.connectAndWait?.();

  const [serverManifest, currentLocalManifest] = await Promise.all([
    fetchManifest(),
    computeLocalManifest(db, ledgerId),
  ]);
  return manifestsMatch(uploadManifest, serverManifest) &&
    manifestsMatch(uploadManifest, currentLocalManifest)
    ? { status: "matched", localManifest: currentLocalManifest, serverManifest }
    : { status: "mismatched", localManifest: currentLocalManifest, serverManifest };
}

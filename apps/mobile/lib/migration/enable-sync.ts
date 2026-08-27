import {
  manifestsMatch,
  type CommandEnvelope,
  type CommandResult,
  type ImportBundlePayload,
  type ImportManifest,
} from "@trove/protocol";

import { generateId } from "@/utils/id";

import { buildImportChunks } from "./chunks";
import { computeLocalManifest, type LocalDb } from "./manifest";

/** Transport seam so the core stays testable without oRPC. */
export type SendImportCommand = (
  envelope: CommandEnvelope<ImportBundlePayload>,
) => Promise<CommandResult>;
export type FetchManifest = (householdId: string) => Promise<ImportManifest>;

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
  householdId: string;
  sendCommand: SendImportCommand;
  fetchManifest: FetchManifest;
}

/**
 * The local-to-cloud migration's upload + verification core (#98): computes
 * the client's manifest, uploads every local row as dependency-ordered
 * `import_bundle` chunks, then compares against the server's post-import
 * recompute. Stops at the first rejected chunk instead of sending the rest.
 *
 * Callers own everything outside the upload itself: creating the household,
 * the pre-import SQLite backup, and — only on a `"matched"` result —
 * flipping sync mode, truncating the outbox, and re-seeding the sync
 * watermark. A `"mismatched"`/`"rejected"` result leaves all of that alone
 * so the backup and the paused state stay intact for the user to inspect.
 */
export async function runImport(args: RunImportArgs): Promise<ImportResult> {
  const { db, householdId, sendCommand, fetchManifest } = args;
  const localManifest = await computeLocalManifest(db);
  const chunks = await buildImportChunks(db);

  for (const chunk of chunks) {
    const result = await sendCommand({
      commandId: generateId(),
      householdId,
      kind: "import_bundle",
      payload: chunk,
    });
    if (result.kind !== "applied") {
      return {
        status: "rejected",
        entityType: chunk.entityType,
        chunkIndex: chunk.chunkIndex,
        result,
      };
    }
  }

  const serverManifest = await fetchManifest(householdId);
  return manifestsMatch(localManifest, serverManifest)
    ? { status: "matched", localManifest, serverManifest }
    : { status: "mismatched", localManifest, serverManifest };
}

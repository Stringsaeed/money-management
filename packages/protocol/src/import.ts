/**
 * Local-to-cloud migration wire contract (#98).
 *
 * A fresh local-only install opts into sync by creating a household and
 * uploading its existing ledger facts as chunked, idempotent `import_bundle`
 * commands, dependency-ordered so every reference resolves by the time it
 * lands: accounts → categories → transactions. The server recomputes an
 * integrity manifest from the imported rows; only a match flips the client
 * to synced mode.
 */

/** Import entity types, in the exact order chunks must be sent. */
export const IMPORT_ENTITY_TYPES = ["account", "category", "transaction"] as const;

export type ImportEntityType = (typeof IMPORT_ENTITY_TYPES)[number];

/** Row cap per `import_bundle` chunk. */
export const MAX_IMPORT_CHUNK_ROWS = 25;

/** The payload of one `import_bundle` command: one entity type's chunk. */
export interface ImportBundlePayload {
  readonly entityType: ImportEntityType;
  /** 0-based position of this chunk among `chunkCount` for `entityType`. */
  readonly chunkIndex: number;
  readonly chunkCount: number;
  readonly rows: readonly Readonly<Record<string, unknown>>[];
}

/**
 * Integrity checksum compared between the client's local computation and the
 * server's recompute from imported rows. A mismatch pauses the import
 * instead of trusting the upload was lossless.
 */
export interface ImportManifest {
  readonly rowCounts: Readonly<Record<ImportEntityType, number>>;
  /** Sum of every transaction's `amountMinor`, grouped by account id. */
  readonly transactionAmountMinorByAccount: Readonly<Record<string, number>>;
}

/** True when every count/sum in `a` and `b` agrees (missing keys read as 0). */
export function manifestsMatch(a: ImportManifest, b: ImportManifest): boolean {
  return (
    numberRecordsEqual(a.rowCounts, b.rowCounts) &&
    numberRecordsEqual(a.transactionAmountMinorByAccount, b.transactionAmountMinorByAccount)
  );
}

function numberRecordsEqual(
  a: Readonly<Record<string, number>>,
  b: Readonly<Record<string, number>>,
): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if ((a[key] ?? 0) !== (b[key] ?? 0)) {
      return false;
    }
  }
  return true;
}

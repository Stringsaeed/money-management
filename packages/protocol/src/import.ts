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

export const MAX_IMPORT_CHUNK_ROWS = 5;

export const MAX_IMPORT_APPLY_ROWS = 25;

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
  /** SHA-256 of every imported row in canonical entity/id order. */
  readonly contentDigest: string;
}

/** True when the aggregate checks and canonical row digest agree. */
export function manifestsMatch(a: ImportManifest, b: ImportManifest): boolean {
  return (
    numberRecordsEqual(a.rowCounts, b.rowCounts) &&
    numberRecordsEqual(a.transactionAmountMinorByAccount, b.transactionAmountMinorByAccount) &&
    a.contentDigest === b.contentDigest
  );
}

export type ImportContentValue = string | number | boolean | null;

export interface ImportContentRow {
  readonly entityType: ImportEntityType;
  readonly row: Readonly<Record<string, ImportContentValue>>;
}

/** Stable input for the client/server SHA-256 import integrity digest. */
export function canonicalizeImportContent(rows: readonly ImportContentRow[]): string {
  return JSON.stringify(
    [...rows]
      .map(({ entityType, row }) => ({ entityType, row: sortRecord(row) }))
      .sort((left, right) => {
        const entityOrder =
          IMPORT_ENTITY_TYPES.indexOf(left.entityType) -
          IMPORT_ENTITY_TYPES.indexOf(right.entityType);
        if (entityOrder !== 0) return entityOrder;
        return String(left.row.id ?? "").localeCompare(String(right.row.id ?? ""));
      }),
  );
}

function sortRecord(
  value: Readonly<Record<string, ImportContentValue>>,
): Readonly<Record<string, ImportContentValue>> {
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, normalizeCanonicalValue(entry, key)]),
  );
}

function normalizeCanonicalValue(value: ImportContentValue, key?: string): ImportContentValue {
  if (
    value !== null &&
    (key === "createdAt" || key === "updatedAt" || key === "lifecycleChangedAt")
  ) {
    const parsed = new Date(String(value));
    return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toISOString();
  }
  return value;
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

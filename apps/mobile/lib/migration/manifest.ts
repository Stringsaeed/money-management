import type { OPSQLiteDatabase } from "drizzle-orm/op-sqlite";
import { CryptoDigestAlgorithm, digestStringAsync } from "expo-crypto";
import type { SQLiteDatabase } from "@/db/sqlite";

import {
  canonicalizeImportContent,
  type ImportBundlePayload,
  type ImportContentValue,
  type ImportManifest,
} from "@trove/protocol";
import { buildImportChunks } from "./chunks";

export type LocalDb = OPSQLiteDatabase<typeof import("@/db/schema")> & {
  $client: SQLiteDatabase;
};

/**
 * Computes the client's half of the import integrity manifest (#98): row
 * counts per imported entity type and transaction amounts summed by
 * account. Compared against the server's post-import recompute.
 */
export async function computeLocalManifest(db: LocalDb, ledgerId: string): Promise<ImportManifest> {
  return computeLocalManifestFromChunks(await buildImportChunks(db, ledgerId));
}

export async function computeLocalManifestFromChunks(
  chunks: readonly ImportBundlePayload[],
): Promise<ImportManifest> {
  const rowCounts = {
    account: 0,
    category: 0,
    recurring_rule: 0,
    budget_workspace: 0,
    envelope: 0,
    category_mapping: 0,
    funding_membership: 0,
    rollover_setting: 0,
    assignment: 0,
    transaction: 0,
    recurring_occurrence: 0,
  };
  const transactionAmountMinorByAccount: Record<string, number> = {};
  const contentRows = chunks.flatMap((chunk) =>
    chunk.rows.map((row) => {
      const content = importContentValues(row);
      rowCounts[chunk.entityType] += 1;
      if (chunk.entityType === "transaction") {
        const accountId = String(content.accountId);
        transactionAmountMinorByAccount[accountId] =
          (transactionAmountMinorByAccount[accountId] ?? 0) + Number(content.amountMinor);
      }
      return { entityType: chunk.entityType, row: content };
    }),
  );
  const canonicalContent = canonicalizeImportContent(contentRows);

  return {
    rowCounts,
    transactionAmountMinorByAccount,
    contentDigest: await digestStringAsync(CryptoDigestAlgorithm.SHA256, canonicalContent),
  };
}

function importContentValues(
  row: Readonly<Record<string, unknown>>,
): Readonly<Record<string, ImportContentValue>> {
  // SAFETY: buildImportChunks emits only validated flat scalar wire fields.
  return row as Readonly<Record<string, ImportContentValue>>;
}

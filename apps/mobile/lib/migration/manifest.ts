import { sql } from "drizzle-orm";
import type { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import type { SQLiteDatabase } from "expo-sqlite";

import type { ImportManifest } from "@trove/protocol";
import {
  accounts,
  assignments,
  budgetWorkspaces,
  categories,
  categoryMappings,
  envelopes,
  fundingMemberships,
  recurringOccurrences,
  recurringRules,
  rolloverSettings,
  transactions,
} from "@/db/schema";

export type LocalDb = ExpoSQLiteDatabase<typeof import("@/db/schema")> & {
  $client: SQLiteDatabase;
};

/**
 * Computes the client's half of the import integrity manifest (#98): row
 * counts per entity type, transaction amounts summed by account, and
 * assignment amounts summed by currency. Compared against the server's
 * post-import recompute — a mismatch pauses the import instead of trusting
 * the upload was lossless.
 */
export async function computeLocalManifest(db: LocalDb): Promise<ImportManifest> {
  const [
    accountRows,
    categoryRows,
    recurringRuleRows,
    recurringOccurrenceRows,
    transactionRows,
    budgetWorkspaceRows,
    envelopeRows,
    categoryMappingRows,
    fundingMembershipRows,
    rolloverSettingRows,
    assignmentRows,
    transactionSums,
    assignmentSums,
  ] = await Promise.all([
    db.select({ count: sql<number>`COUNT(*)` }).from(accounts),
    db.select({ count: sql<number>`COUNT(*)` }).from(categories),
    db.select({ count: sql<number>`COUNT(*)` }).from(recurringRules),
    db.select({ count: sql<number>`COUNT(*)` }).from(recurringOccurrences),
    db.select({ count: sql<number>`COUNT(*)` }).from(transactions),
    db.select({ count: sql<number>`COUNT(*)` }).from(budgetWorkspaces),
    db.select({ count: sql<number>`COUNT(*)` }).from(envelopes),
    db.select({ count: sql<number>`COUNT(*)` }).from(categoryMappings),
    db.select({ count: sql<number>`COUNT(*)` }).from(fundingMemberships),
    db.select({ count: sql<number>`COUNT(*)` }).from(rolloverSettings),
    db.select({ count: sql<number>`COUNT(*)` }).from(assignments),
    db
      .select({
        key: transactions.accountId,
        total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
      })
      .from(transactions)
      .groupBy(transactions.accountId),
    db
      .select({
        key: assignments.currency,
        total: sql<number>`COALESCE(SUM(${assignments.amountMinor}), 0)`,
      })
      .from(assignments)
      .groupBy(assignments.currency),
  ]);

  return {
    rowCounts: {
      account: accountRows[0]?.count ?? 0,
      category: categoryRows[0]?.count ?? 0,
      recurringRule: recurringRuleRows[0]?.count ?? 0,
      recurringOccurrence: recurringOccurrenceRows[0]?.count ?? 0,
      transaction: transactionRows[0]?.count ?? 0,
      budgetWorkspace: budgetWorkspaceRows[0]?.count ?? 0,
      envelope: envelopeRows[0]?.count ?? 0,
      categoryMapping: categoryMappingRows[0]?.count ?? 0,
      fundingMembership: fundingMembershipRows[0]?.count ?? 0,
      rolloverSetting: rolloverSettingRows[0]?.count ?? 0,
      assignment: assignmentRows[0]?.count ?? 0,
    },
    transactionAmountMinorByAccount: sumsByKey(transactionSums),
    assignmentAmountMinorByCurrency: sumsByKey(assignmentSums),
  };
}

/** Collapses grouped `{key, total}` rows into a `key -> total` record. */
function sumsByKey(rows: readonly { key: string; total: number }[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const row of rows) {
    totals[row.key] = row.total;
  }
  return totals;
}

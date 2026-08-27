import { eq, sql } from "drizzle-orm";
import type { SQLiteColumn, SQLiteTable } from "drizzle-orm/sqlite-core";

import type { ImportManifest } from "@trove/protocol";
import { category, ledgerAccount, transaction } from "@trove/db/schema/ledger";
import { recurringOccurrence, recurringRule } from "@trove/db/schema/recurring";
import {
  assignment,
  budgetWorkspace,
  categoryMapping,
  envelope,
  fundingMembership,
  rolloverSetting,
} from "@trove/db/schema/budget";

import type { CommandDatabase } from "../commands/types";

/**
 * Recomputes the import integrity manifest (#98) from a household's
 * currently-imported rows: row counts per entity type, transaction amounts
 * summed by account, and assignment amounts summed by currency. Compared
 * against the client's own pre-import computation — a mismatch means the
 * upload was lossy.
 */
export async function computeImportManifest(
  db: CommandDatabase,
  householdId: string,
): Promise<ImportManifest> {
  const [
    accountCount,
    categoryCount,
    recurringRuleCount,
    recurringOccurrenceCount,
    transactionCount,
    budgetWorkspaceCount,
    envelopeCount,
    categoryMappingCount,
    fundingMembershipCount,
    rolloverSettingCount,
    assignmentCount,
    transactionSums,
    assignmentSums,
  ] = await db.batch([
    countRows(db, ledgerAccount, householdId),
    countRows(db, category, householdId),
    countRows(db, recurringRule, householdId),
    countRows(db, recurringOccurrence, householdId),
    countRows(db, transaction, householdId),
    countRows(db, budgetWorkspace, householdId),
    countRows(db, envelope, householdId),
    countRows(db, categoryMapping, householdId),
    countRows(db, fundingMembership, householdId),
    countRows(db, rolloverSetting, householdId),
    countRows(db, assignment, householdId),
    db
      .select({
        key: transaction.accountId,
        total: sql<number>`COALESCE(SUM(${transaction.amountMinor}), 0)`,
      })
      .from(transaction)
      .where(eq(transaction.householdId, householdId))
      .groupBy(transaction.accountId),
    db
      .select({
        key: assignment.currency,
        total: sql<number>`COALESCE(SUM(${assignment.amountMinor}), 0)`,
      })
      .from(assignment)
      .where(eq(assignment.householdId, householdId))
      .groupBy(assignment.currency),
  ]);

  return {
    rowCounts: {
      account: accountCount[0]?.count ?? 0,
      category: categoryCount[0]?.count ?? 0,
      recurringRule: recurringRuleCount[0]?.count ?? 0,
      recurringOccurrence: recurringOccurrenceCount[0]?.count ?? 0,
      transaction: transactionCount[0]?.count ?? 0,
      budgetWorkspace: budgetWorkspaceCount[0]?.count ?? 0,
      envelope: envelopeCount[0]?.count ?? 0,
      categoryMapping: categoryMappingCount[0]?.count ?? 0,
      fundingMembership: fundingMembershipCount[0]?.count ?? 0,
      rolloverSetting: rolloverSettingCount[0]?.count ?? 0,
      assignment: assignmentCount[0]?.count ?? 0,
    },
    transactionAmountMinorByAccount: sumsByKey(transactionSums),
    assignmentAmountMinorByCurrency: sumsByKey(assignmentSums),
  };
}

/** `SELECT COUNT(*)` for one household-scoped table — shared by every entity above. */
function countRows<Table extends SQLiteTable & { householdId: SQLiteColumn }>(
  db: CommandDatabase,
  table: Table,
  householdId: string,
) {
  return db
    .select({ count: sql<number>`COUNT(*)` })
    .from(table)
    .where(eq(table.householdId, householdId));
}

/** Collapses grouped `{key, total}` rows into a `key -> total` record. */
function sumsByKey(rows: readonly { key: string; total: number }[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const row of rows) {
    totals[row.key] = row.total;
  }
  return totals;
}

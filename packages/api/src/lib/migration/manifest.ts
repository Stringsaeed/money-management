import { eq, sql } from "drizzle-orm";
import type { SQLiteColumn, SQLiteTable } from "drizzle-orm/sqlite-core";

import type { ImportManifest } from "@trove/protocol";
import { category, ledgerAccount, transaction } from "@trove/db/schema/ledger";

import type { CommandDatabase } from "../commands/types";

/**
 * Recomputes the import integrity manifest (#98) from a household's
 * currently-imported rows: row counts per entity type and transaction
 * amounts summed by account. Compared against the client's own pre-import
 * computation.
 */
export async function computeImportManifest(
  db: CommandDatabase,
  householdId: string,
): Promise<ImportManifest> {
  const [accountCount, categoryCount, transactionCount, transactionSums] = await db.batch([
    countRows(db, ledgerAccount, householdId),
    countRows(db, category, householdId),
    countRows(db, transaction, householdId),
    db
      .select({
        key: transaction.accountId,
        total: sql<number>`COALESCE(SUM(${transaction.amountMinor}), 0)`,
      })
      .from(transaction)
      .where(eq(transaction.householdId, householdId))
      .groupBy(transaction.accountId),
  ]);

  return {
    rowCounts: {
      account: accountCount[0]?.count ?? 0,
      category: categoryCount[0]?.count ?? 0,
      transaction: transactionCount[0]?.count ?? 0,
    },
    transactionAmountMinorByAccount: sumsByKey(transactionSums),
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

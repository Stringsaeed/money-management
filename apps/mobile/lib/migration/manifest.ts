import { sql } from "drizzle-orm";
import type { OPSQLiteDatabase } from "drizzle-orm/op-sqlite";
import type { SQLiteDatabase } from "@/db/sqlite";

import type { ImportManifest } from "@trove/protocol";
import { accounts, categories, transactions } from "@/db/schema";

export type LocalDb = OPSQLiteDatabase<typeof import("@/db/schema")> & {
  $client: SQLiteDatabase;
};

/**
 * Computes the client's half of the import integrity manifest (#98): row
 * counts per imported entity type and transaction amounts summed by
 * account. Compared against the server's post-import recompute.
 */
export async function computeLocalManifest(db: LocalDb): Promise<ImportManifest> {
  const [accountRows, categoryRows, transactionRows, transactionSums] = await Promise.all([
    db.select({ count: sql<number>`COUNT(*)` }).from(accounts),
    db.select({ count: sql<number>`COUNT(*)` }).from(categories),
    db.select({ count: sql<number>`COUNT(*)` }).from(transactions),
    db
      .select({
        key: transactions.accountId,
        total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
      })
      .from(transactions)
      .groupBy(transactions.accountId),
  ]);

  return {
    rowCounts: {
      account: accountRows[0]?.count ?? 0,
      category: categoryRows[0]?.count ?? 0,
      transaction: transactionRows[0]?.count ?? 0,
    },
    transactionAmountMinorByAccount: sumsByKey(transactionSums),
  };
}

function sumsByKey(rows: readonly { key: string; total: number }[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const row of rows) {
    totals[row.key] = row.total;
  }
  return totals;
}

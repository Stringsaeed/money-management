import { eq, sql } from "drizzle-orm";

import type { ImportManifest } from "@trove/protocol";
import { category, ledgerAccount, transaction } from "@trove/db/schema/ledger";

import type { CommandDatabase } from "../commands/types";

export async function computeImportManifest(
  db: CommandDatabase,
  householdId: string,
): Promise<ImportManifest> {
  const [accountCount, categoryCount, transactionCount, transactionSums] = await Promise.all([
    db
      .select({ count: sql<number>`COUNT(*)` })
      .from(ledgerAccount)
      .where(eq(ledgerAccount.householdId, householdId)),
    db
      .select({ count: sql<number>`COUNT(*)` })
      .from(category)
      .where(eq(category.householdId, householdId)),
    db
      .select({ count: sql<number>`COUNT(*)` })
      .from(transaction)
      .where(eq(transaction.householdId, householdId)),
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

function sumsByKey(rows: readonly { key: string; total: number }[]) {
  const totals: Record<string, number> = {};
  for (const row of rows) {
    totals[row.key] = row.total;
  }
  return totals;
}

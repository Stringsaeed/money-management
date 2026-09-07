import { eq, sql } from "drizzle-orm";
import { z } from "zod";

import type { ImportManifest } from "@trove/protocol";
import { category, ledgerAccount, transaction } from "@trove/db/schema/ledger";

import type { CommandDatabase } from "../commands/types";

type ImportAggregate = string | number | bigint;

const importAggregateSchema = z
  .union([z.string().regex(/^\d+$/).transform(Number), z.number(), z.bigint().transform(Number)])
  .pipe(z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER));

export async function computeImportManifest(
  db: CommandDatabase,
  householdId: string,
): Promise<ImportManifest> {
  const [accountCount, categoryCount, transactionCount, transactionSums] = await Promise.all([
    db
      .select({ count: sql<ImportAggregate>`COUNT(*)` })
      .from(ledgerAccount)
      .where(eq(ledgerAccount.householdId, householdId)),
    db
      .select({ count: sql<ImportAggregate>`COUNT(*)` })
      .from(category)
      .where(eq(category.householdId, householdId)),
    db
      .select({ count: sql<ImportAggregate>`COUNT(*)` })
      .from(transaction)
      .where(eq(transaction.householdId, householdId)),
    db
      .select({
        key: transaction.accountId,
        total: sql<ImportAggregate>`COALESCE(SUM(${transaction.amountMinor}), 0)`,
      })
      .from(transaction)
      .where(eq(transaction.householdId, householdId))
      .groupBy(transaction.accountId),
  ]);

  return {
    rowCounts: {
      account: parseImportAggregate(accountCount[0]?.count ?? 0, "account count"),
      category: parseImportAggregate(categoryCount[0]?.count ?? 0, "category count"),
      transaction: parseImportAggregate(transactionCount[0]?.count ?? 0, "transaction count"),
    },
    transactionAmountMinorByAccount: sumsByKey(transactionSums),
  };
}

export function parseImportAggregate(value: ImportAggregate, label: string): number {
  const result = importAggregateSchema.safeParse(value);
  if (!result.success) {
    throw new Error(`Invalid ${label} returned by the database.`);
  }
  return result.data;
}

function sumsByKey(rows: readonly { key: string; total: ImportAggregate }[]) {
  const totals: Record<string, number> = {};
  for (const row of rows) {
    totals[row.key] = parseImportAggregate(row.total, `transaction amount sum for ${row.key}`);
  }
  return totals;
}

import { and, asc, desc, eq, lt, or } from "drizzle-orm";

import { ledgerAccount, transaction } from "@trove/db/schema/ledger";

import type { CommandDatabase } from "../commands/types";
import type { HouseholdCaller } from "../require-member";
import { requireHouseholdMember } from "../require-member";

export async function listAccounts(db: CommandDatabase, caller: HouseholdCaller) {
  await requireHouseholdMember(db, caller.userId, caller.householdId);
  return db
    .select()
    .from(ledgerAccount)
    .where(eq(ledgerAccount.householdId, caller.householdId))
    .orderBy(asc(ledgerAccount.sortOrder), asc(ledgerAccount.name));
}

export interface TransactionCursor {
  readonly date: string;
  readonly id: string;
}

export interface TransactionPage {
  readonly transactions: readonly (typeof transaction.$inferSelect)[];
  readonly hasMore: boolean;
  readonly nextCursor: TransactionCursor | null;
}

export async function listTransactions(
  db: CommandDatabase,
  caller: HouseholdCaller,
  limit: number,
  cursor?: TransactionCursor,
): Promise<TransactionPage> {
  await requireHouseholdMember(db, caller.userId, caller.householdId);
  const rows = await db
    .select({ transaction })
    .from(transaction)
    .where(
      and(
        eq(transaction.householdId, caller.householdId),
        ...(cursor
          ? [
              or(
                lt(transaction.date, cursor.date),
                and(eq(transaction.date, cursor.date), lt(transaction.id, cursor.id)),
              ),
            ]
          : []),
      ),
    )
    .orderBy(desc(transaction.date), desc(transaction.id))
    .limit(limit + 1);
  const hasMore = rows.length > limit;
  const transactions = rows.slice(0, limit).map((row) => row.transaction);
  const last = transactions.at(-1);
  return {
    transactions,
    hasMore,
    nextCursor: hasMore && last ? { date: last.date, id: last.id } : null,
  };
}

export async function getTransaction(
  db: CommandDatabase,
  caller: HouseholdCaller,
  transactionId: string,
): Promise<typeof transaction.$inferSelect | null> {
  await requireHouseholdMember(db, caller.userId, caller.householdId);
  const rows = await db
    .select()
    .from(transaction)
    .where(and(eq(transaction.householdId, caller.householdId), eq(transaction.id, transactionId)))
    .limit(1);
  return rows[0] ?? null;
}

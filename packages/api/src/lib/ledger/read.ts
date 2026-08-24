import { and, asc, desc, eq, inArray, isNull, lt, or } from "drizzle-orm";

import { ledgerAccount, transaction } from "@trove/db/schema/ledger";

import type { CommandDatabase } from "../commands/types";
import type { HouseholdCaller } from "../require-member";
import { requireHouseholdMember } from "../require-member";

export async function listAccounts(db: CommandDatabase, caller: HouseholdCaller) {
  await requireHouseholdMember(db, caller.userId, caller.householdId);
  return db
    .select()
    .from(ledgerAccount)
    .where(
      and(
        eq(ledgerAccount.householdId, caller.householdId),
        or(eq(ledgerAccount.visibility, "public"), eq(ledgerAccount.ownerUserId, caller.userId)),
      ),
    )
    .orderBy(asc(ledgerAccount.sortOrder), asc(ledgerAccount.name));
}

export interface TransactionPage {
  readonly transactions: readonly (typeof transaction.$inferSelect)[];
  readonly hasMore: boolean;
}

export async function listTransactions(
  db: CommandDatabase,
  caller: HouseholdCaller,
  limit: number,
  beforeDate?: string,
): Promise<TransactionPage> {
  await requireHouseholdMember(db, caller.userId, caller.householdId);
  const visibleAccountIds = db
    .select({ id: ledgerAccount.id })
    .from(ledgerAccount)
    .where(
      and(
        eq(ledgerAccount.householdId, caller.householdId),
        or(eq(ledgerAccount.visibility, "public"), eq(ledgerAccount.ownerUserId, caller.userId)),
      ),
    );
  const rows = await db
    .select({ transaction })
    .from(transaction)
    .where(
      and(
        eq(transaction.householdId, caller.householdId),
        inArray(transaction.accountId, visibleAccountIds),
        or(isNull(transaction.toAccountId), inArray(transaction.toAccountId, visibleAccountIds)),
        ...(beforeDate ? [lt(transaction.date, beforeDate)] : []),
      ),
    )
    .orderBy(desc(transaction.date), desc(transaction.id))
    .limit(limit + 1);
  const hasMore = rows.length > limit;
  return { transactions: rows.slice(0, limit).map((row) => row.transaction), hasMore };
}

import { orpc } from "@/lib/server/orpc";
import {
  enqueueCommand,
  listProjectableCommands,
  observeOutbox,
  readSyncWatermark,
  type LocalDb,
} from "@/lib/sync/outbox";
import type { SyncedTransaction } from "@/modules/ledger-data-source/synced-mappers";
import {
  readSyncedTransactionSnapshot,
  writeSyncedTransactionSnapshot,
  type SyncedTransactionSnapshot,
} from "@/modules/ledger-data-source/synced-transaction-snapshot";
import { generateId } from "@/utils/id";
import { nowIso } from "@/utils/date";

import type { LedgerDependencies } from "./ledger";

export const createLedgerDependencies = (input: {
  readonly householdId: string;
  readonly userId: string;
  readonly db: LocalDb;
  readonly offline?: boolean;
}): LedgerDependencies => {
  const { householdId, userId, db, offline } = input;
  return {
    householdId,
    userId,
    dbIdentity: db,
    offline,
    fetchAuthoritative: () => fetchAuthoritativeSnapshot(householdId, userId),
    readCachedSnapshot: () => readSyncedTransactionSnapshot(db, householdId, userId),
    writeCachedSnapshot: (snapshot) => writeSyncedTransactionSnapshot(db, snapshot),
    readWatermark: () => readSyncWatermark(db, householdId),
    listQueuedCommands: () => listProjectableCommands(db, householdId, userId),
    enqueue: (command) => enqueueCommand(db, { ...command, userId }),
    observeOutbox,
    newId: generateId,
    now: nowIso,
  };
};

const fetchAuthoritativeSnapshot = async (
  householdId: string,
  userId: string,
): Promise<SyncedTransactionSnapshot> => {
  const [accounts, categories, transactions] = await Promise.all([
    orpc.ledger.accounts.list({ householdId }),
    orpc.ledger.categories.list({ householdId }),
    listAllRawTransactions(householdId),
  ]);
  return { householdId, userId, accounts, categories, transactions };
};

const listAllRawTransactions = async (householdId: string): Promise<SyncedTransaction[]> => {
  const transactions: SyncedTransaction[] = [];
  let cursor: { date: string; id: string } | undefined;
  for (;;) {
    const page = await orpc.ledger.transactions.list({
      householdId,
      limit: 200,
      ...(cursor && { beforeDate: cursor.date, beforeId: cursor.id }),
    });
    transactions.push(...page.transactions);
    if (!page.hasMore) return transactions;
    if (
      !page.nextCursor ||
      (page.nextCursor.date === cursor?.date && page.nextCursor.id === cursor?.id)
    ) {
      throw new Error("The synced Transaction cursor did not advance. Retry the ledger refresh.");
    }
    cursor = page.nextCursor;
  }
};

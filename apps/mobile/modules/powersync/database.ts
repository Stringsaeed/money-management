import {
  PowerSyncDatabase,
  type PowerSyncDatabase as PowerSyncDatabaseType,
} from "@powersync/react-native";

import { createPowerSyncConnector } from "./connector";
import { markPowerSyncLedgerRevoked } from "./revoked-ledgers";
import { powerSyncSchema } from "./schema";

export { restorePowerSyncLedgerAccess } from "./revoked-ledgers";

interface ActivePowerSyncDatabase {
  readonly database: PowerSyncDatabaseType;
  readonly userId: string;
}

let active: ActivePowerSyncDatabase | null = null;
let transition: Promise<void> = Promise.resolve();

export const openPowerSyncDatabase = async (userId: string): Promise<PowerSyncDatabaseType> => {
  await serializeTransition(async () => {
    if (active?.userId === userId) return;
    if (active) await clearActiveDatabase();
    active = {
      userId,
      database: new PowerSyncDatabase({
        schema: powerSyncSchema,
        database: { dbFilename: "powersync.db" },
      }),
    };
    await active.database.init();
  });
  if (!active || active.userId !== userId) {
    throw new Error("PowerSync database initialization did not retain the signed-in user.");
  }
  return active.database;
};

export const connectPowerSync = async (userId: string): Promise<PowerSyncDatabaseType> => {
  const database = await openPowerSyncDatabase(userId);
  await database.connect(createPowerSyncConnector(userId));
  return database;
};

export const disconnectPowerSync = async (): Promise<void> => {
  await active?.database.disconnect();
};

export const disconnectAndClearPowerSync = async (): Promise<void> => {
  await serializeTransition(clearActiveDatabase);
};

export const peekPowerSyncDatabase = (): PowerSyncDatabaseType | null => active?.database ?? null;

/** Stops uploads immediately and marks queued commands for this removed Household as discard-only. */
export const revokePowerSyncLedger = async (ledgerId: string): Promise<void> => {
  markPowerSyncLedgerRevoked(ledgerId);
  await active?.database.disconnect();
  await active?.database.execute("DELETE FROM rejected_changes WHERE ledger_id = ?", [ledgerId]);
};

const clearActiveDatabase = async (): Promise<void> => {
  const current = active;
  active = null;
  if (!current) return;
  await current.database.disconnectAndClear();
  await current.database.close();
};

const serializeTransition = async (operation: () => Promise<void>): Promise<void> => {
  const next = transition.then(operation, operation);
  transition = next.catch(() => undefined);
  return next;
};

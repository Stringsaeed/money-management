import type { PowerSyncDatabase } from "@powersync/react-native";

import { nowIso } from "@/utils/date";
import { generateId } from "@/utils/id";

import { createPowerSyncLedgerCollections } from "./collections";
import type { LedgerDependencies } from "./ledger";

export const createLedgerDependencies = (input: {
  readonly householdId: string;
  readonly userId: string;
  readonly database: PowerSyncDatabase;
  readonly offline?: boolean;
}): LedgerDependencies => ({
  householdId: input.householdId,
  userId: input.userId,
  dbIdentity: input.database,
  collections: createPowerSyncLedgerCollections(input.database, input.householdId),
  offline: input.offline,
  newId: generateId,
  now: nowIso,
});

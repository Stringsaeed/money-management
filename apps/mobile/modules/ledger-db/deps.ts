import type { PowerSyncDatabase } from "@powersync/react-native";

import type { SyncedLedgerBinding } from "@/modules/ledger-data-source/provider";
import { nowIso } from "@/utils/date";
import { generateId } from "@/utils/id";

import { createPowerSyncLedgerCollections } from "./collections";
import type { LedgerDependencies } from "./ledger";

export const createLedgerDependencies = (input: {
  readonly ledger: SyncedLedgerBinding;
  readonly userId: string;
  readonly database: PowerSyncDatabase;
  readonly offline?: boolean;
}): LedgerDependencies => ({
  binding: input.ledger,
  userId: input.userId,
  dbIdentity: input.database,
  collections: createPowerSyncLedgerCollections(input.database, input.ledger),
  offline: input.offline,
  newId: generateId,
  now: nowIso,
});

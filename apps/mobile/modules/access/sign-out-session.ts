import type { QueryClient } from "@tanstack/react-query";

import { clearAllSyncEnrollment } from "@/lib/migration/status";
import type { LocalDb } from "@/lib/migration/manifest";
import { disconnectAndClearPowerSync } from "@/modules/powersync/database";
import { useSyncModeStore } from "@/stores/sync-mode-store";

import { clearClaim } from "./claim-store";
import { HOUSEHOLDS_KEY } from "./households-key";
import { clearLedgerSelection } from "./ledger-selection-store";
import { tryRemoteSignOut } from "./session-probe";

/** Wipes signed-in sync caches and credentials; leaves authority-local SQLite intact (#229). */
export async function runSignedOutSessionCleanup(deps: {
  readonly db: LocalDb;
  readonly queryClient: QueryClient;
  readonly userId: string | null;
}): Promise<void> {
  await disconnectAndClearPowerSync();
  await clearAllSyncEnrollment(deps.db);
  useSyncModeStore.getState().setLocalOnly("powersync_unavailable");
  await tryRemoteSignOut();
  if (deps.userId) await clearLedgerSelection(deps.userId);
  await clearClaim();
  await Promise.all([
    deps.queryClient.removeQueries({ queryKey: HOUSEHOLDS_KEY }),
    deps.queryClient.removeQueries({ queryKey: ["household"] }),
    deps.queryClient.removeQueries({ queryKey: ["migration"] }),
    deps.queryClient.removeQueries({ queryKey: ["sync"] }),
  ]);
}

import { useQuery } from "@tanstack/react-query";

import { orpc } from "@/lib/server/orpc";
import { useSyncModeStore } from "@/stores/sync-mode-store";

export type AuthorizedLedgerAccount = Awaited<ReturnType<typeof orpc.ledger.accounts.list>>[number];

/** Server-authorized Account visibility used only to filter retained local rows. */
export const useAuthorizedLedgerAccounts = (householdId: string | null) => {
  const syncMode = useSyncModeStore((state) => state.mode);
  return useQuery({
    queryKey: ["ledger-authorization", "accounts", householdId, syncMode],
    queryFn: () => orpc.ledger.accounts.list({ householdId: householdId! }),
    // Fail closed while local-only. The root SyncModeBanner explains why
    // remote Household features are paused and how to retry.
    enabled: Boolean(householdId) && syncMode === "synced",
  });
};

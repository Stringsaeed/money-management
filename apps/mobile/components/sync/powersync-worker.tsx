import { useMigratedHouseholdId } from "@/hooks/use-enable-sync";
import { useActiveHousehold } from "@/hooks/use-households";
import { useSyncWorker } from "@/hooks/use-sync-worker";
import { signedInUserId, useAccess } from "@/modules/access";

export function PowerSyncWorker() {
  const userId = signedInUserId(useAccess());
  const { activeHousehold } = useActiveHousehold();
  const migration = useMigratedHouseholdId();
  const householdId = activeHousehold?.householdId ?? null;
  const eligible = Boolean(userId && householdId && migration.data === householdId);
  useSyncWorker(eligible ? householdId : null, eligible ? (userId ?? undefined) : undefined);
  return null;
}

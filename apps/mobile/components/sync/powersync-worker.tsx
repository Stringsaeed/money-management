import { useMigratedHouseholdId, useSyncEnrollment } from "@/hooks/use-enable-sync";
import { useActiveHousehold } from "@/hooks/use-households";
import { useSyncWorker } from "@/hooks/use-sync-worker";
import { signedInUserId, useAccess } from "@/modules/access";

export function PowerSyncWorker() {
  const access = useAccess();
  const userId = signedInUserId(access);
  const { activeHousehold } = useActiveHousehold();
  const migration = useMigratedHouseholdId();
  const enrollment = useSyncEnrollment();
  const householdId = activeHousehold?.householdId ?? null;
  const householdMigrated = Boolean(householdId && migration.data === householdId);
  const personalEnrolled = Boolean(userId) && enrollment.data?.personalSyncUserId === userId;
  const workerEligible = Boolean(userId && (householdMigrated || personalEnrolled));
  useSyncWorker({
    householdId: householdMigrated ? householdId : null,
    userId: workerEligible ? (userId ?? undefined) : undefined,
    syncPersonalLedger: personalEnrolled && !householdMigrated,
    preserveWhenIneligible: access.kind !== "anonymous",
  });
  return null;
}

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { planMembershipRevocation } from "@/components/sync/plan-membership-revocation";
import { useDatabase } from "@/db/client";
import { useMigratedHouseholdId } from "@/hooks/use-enable-sync";
import { clearHouseholdSyncEnrollment } from "@/lib/migration/status";
import { useAccess } from "@/modules/access";
import { disconnectAndClearPowerSync } from "@/modules/powersync/database";

/**
 * When a selected or enrolled Household Membership disappears from listMine,
 * treat it as confirmed removal: stop uploads and clear that Household's
 * PowerSync cache/pending edits. Ordinary Personal selection does not clear.
 * Identity claim stays until explicit sign-out (session_revoked cleanup).
 */
export function MembershipRevocationCleanup() {
  const access = useAccess();
  const db = useDatabase();
  const queryClient = useQueryClient();
  const migration = useMigratedHouseholdId();
  const previousMemberships = useRef<ReadonlySet<string>>(new Set());

  useEffect(() => {
    if (access.kind !== "signed_in") {
      previousMemberships.current = new Set();
      return;
    }
    const current = new Set(access.memberships.map((row) => row.householdId));
    const previous = previousMemberships.current;
    previousMemberships.current = current;

    const plan = planMembershipRevocation({
      previousHouseholdIds: previous,
      currentHouseholdIds: current,
      enrolledHouseholdId: migration.data,
      selection: access.selection,
    });
    if (plan == null) return;

    void (async () => {
      if (plan.clearHouseholdSync) {
        await clearHouseholdSyncEnrollment(db);
        await disconnectAndClearPowerSync();
        await queryClient.invalidateQueries({ queryKey: ["migration"] });
      }
      if (plan.clearHouseholdSelection) {
        await access.setActiveHousehold(null);
      }
    })();
  }, [access, db, migration.data, queryClient]);

  return null;
}

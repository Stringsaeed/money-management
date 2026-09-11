import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useDatabase } from "@/db/client";
import { useMigratedHouseholdId } from "@/hooks/use-enable-sync";
import { clearHouseholdSyncEnrollment } from "@/lib/migration/status";
import { useAccess } from "@/modules/access";
import { disconnectAndClearPowerSync } from "@/modules/powersync/database";

/**
 * When a selected or enrolled Household Membership disappears from listMine,
 * treat it as confirmed removal: stop uploads and clear that Household's
 * PowerSync cache/pending edits. Ordinary Personal selection does not clear.
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
    const removed = [...previous].filter((id) => !current.has(id));
    previousMemberships.current = current;

    const enrolled = migration.data;
    const lostEnrollment = enrolled != null && !current.has(enrolled);
    if (removed.length === 0 && !lostEnrollment) return;

    void (async () => {
      if (lostEnrollment || (enrolled != null && removed.includes(enrolled))) {
        await clearHouseholdSyncEnrollment(db);
        await disconnectAndClearPowerSync();
        await queryClient.invalidateQueries({ queryKey: ["migration"] });
      }
      if (access.selection.kind === "household" && !current.has(access.selection.householdId)) {
        await access.setActiveHousehold(null);
      }
    })();
  }, [access, db, migration.data, queryClient]);

  return null;
}

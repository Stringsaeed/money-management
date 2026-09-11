import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useDatabase } from "@/db/client";
import { useMigratedHouseholdId } from "@/hooks/use-enable-sync";
import { clearHouseholdSyncEnrollment } from "@/lib/migration/status";
import { useAccess } from "@/modules/access";
import { restorePowerSyncLedgerAccess, revokePowerSyncLedger } from "@/modules/powersync/database";

function restoreConfirmedLedgerAccess(householdIds: readonly string[]): void {
  for (const householdId of householdIds) {
    restorePowerSyncLedgerAccess(householdId);
  }
}

function reportRevocationCleanupFailure(): void {
  console.error("[PowerSync] Failed to finish confirmed Household revocation cleanup.");
}

/**
 * When a Household Membership disappears from a successful listMine read,
 * stop uploads immediately and mark that Ledger's queued Commands as
 * discard-only. Stream unsubscription owns removal of its server cache;
 * unrelated Personal/Household pending edits are never globally cleared.
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
    // A failed listMine read is ordinary offline use, not proof of removal.
    if (access.household.kind === "unavailable") return;

    const currentIds = access.memberships.map((row) => row.householdId);
    const current = new Set(currentIds);
    // A successful reconciled Membership read is the only client-side signal
    // that may re-enable uploads after this User is explicitly invited back.
    restoreConfirmedLedgerAccess(currentIds);
    const previous = previousMemberships.current;
    const removed = [...previous].filter((id) => !current.has(id));
    previousMemberships.current = current;

    const enrolled = migration.data;
    const lostEnrollment = enrolled != null && !current.has(enrolled);
    const lostSelection =
      access.selection.kind === "household" && !current.has(access.selection.householdId)
        ? access.selection.householdId
        : null;
    const revoked = new Set([
      ...removed,
      ...(lostEnrollment && enrolled ? [enrolled] : []),
      ...(lostSelection ? [lostSelection] : []),
    ]);
    if (revoked.size === 0) return;

    void (async () => {
      for (const householdId of revoked) {
        await revokePowerSyncLedger(householdId);
      }
      if (lostEnrollment) {
        await clearHouseholdSyncEnrollment(db);
        await queryClient.invalidateQueries({ queryKey: ["migration"] });
      }
      if (lostSelection) {
        await access.selectLedger(null);
      }
    })().catch(reportRevocationCleanupFailure);
  }, [access, db, migration.data, queryClient]);

  return null;
}

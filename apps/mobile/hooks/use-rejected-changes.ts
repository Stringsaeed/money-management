import { useCallback, useEffect, useState } from "react";
import type { CommandEnvelope } from "@trove/protocol";
import { useActiveHousehold } from "@/hooks/use-households";
import {
  discardRejectedChange,
  listRejectedChanges,
  resubmitRejectedChange,
  type RejectedChange,
} from "@/modules/powersync/rejected-changes";
import { useSyncedTransactionLedger } from "@/modules/ledger-db/provider";
import { generateId } from "@/utils/id";

/**
 * Rejected Changes inbox state (#94): lists every command the server refused
 * for the active household and exposes the re-edit/resubmit and discard
 * flows. Resubmission always mints a NEW commandId so the edited intent is a
 * fresh idempotency key.
 *
 * The ledger is null before PowerSync connects, while the household stays
 * local-only, and mid-migration (#193) — those states show an empty inbox
 * instead of throwing, since a command can only be rejected once it has been
 * submitted against an active, synced household.
 */
export function useRejectedChanges() {
  const ledger = useSyncedTransactionLedger();
  const { activeHousehold } = useActiveHousehold();
  const householdId = activeHousehold?.householdId ?? null;

  const [changes, setChanges] = useState<readonly RejectedChange[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!ledger || !householdId) {
      setChanges([]);
      setError(null);
      setIsLoading(false);
      return;
    }
    try {
      setChanges(listRejectedChanges(ledger.collections, householdId));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Could not load rejected changes."));
    } finally {
      setIsLoading(false);
    }
  }, [householdId, ledger]);

  useEffect(() => {
    void refresh();
    if (!ledger) return;
    const subscription = ledger.collections.rejectedChanges.subscribeChanges(() => void refresh());
    return () => subscription.unsubscribe();
  }, [ledger, refresh]);

  const discard = useCallback(
    async (commandId: string) => {
      if (!ledger) throw new Error("The inbox isn't connected yet. Try again in a moment.");
      await discardRejectedChange(ledger.collections, commandId);
      await refresh();
    },
    [ledger, refresh],
  );

  const resubmit = useCallback(
    async (commandId: string, editedPayload?: CommandEnvelope["payload"]) => {
      if (!ledger) throw new Error("The inbox isn't connected yet. Try again in a moment.");
      // A resubmitted command gets a NEW id: the old one is spent as an
      // idempotency key, and the server must treat this as a fresh intent.
      const newCommandId = generateId();
      const change = getChange(changes, commandId);
      await resubmitRejectedChange(ledger, change, newCommandId, editedPayload);
      await refresh();
      return newCommandId;
    },
    [changes, ledger, refresh],
  );

  return { changes, isLoading, error, refresh, discard, resubmit };
}

const getChange = (changes: readonly RejectedChange[], commandId: string): RejectedChange => {
  const change = changes.find((candidate) => candidate.commandId === commandId);
  if (!change) throw new Error("This rejected change was already discarded or resubmitted.");
  return change;
};

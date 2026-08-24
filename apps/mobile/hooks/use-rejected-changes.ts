import { useCallback, useEffect, useState } from "react";

import { useDatabase } from "@/db/client";
import { useActiveHousehold } from "@/hooks/use-households";
import {
  discardRejectedCommand,
  listRejectedChanges,
  resubmitRejectedCommand,
  type RejectedChange,
} from "@/lib/sync/outbox";
import { generateId } from "@/utils/id";

/**
 * Rejected Changes inbox state (#94): lists every command the server refused
 * for the active household and exposes the re-edit/resubmit and discard
 * flows. Resubmission always mints a NEW commandId so the edited intent is a
 * fresh idempotency key.
 */
export function useRejectedChanges() {
  const db = useDatabase();
  const { activeHousehold } = useActiveHousehold();
  const householdId = activeHousehold?.householdId ?? null;

  const [changes, setChanges] = useState<readonly RejectedChange[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!householdId) {
      setChanges([]);
      setIsLoading(false);
      return;
    }
    try {
      setChanges(await listRejectedChanges(db, householdId));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Could not load rejected changes."));
    } finally {
      setIsLoading(false);
    }
  }, [db, householdId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const discard = useCallback(
    async (commandId: string) => {
      await discardRejectedCommand(db, commandId);
      await refresh();
    },
    [db, refresh],
  );

  const resubmit = useCallback(
    async (commandId: string, editedPayload?: unknown) => {
      // A resubmitted command gets a NEW id: the old one is spent as an
      // idempotency key, and the server must treat this as a fresh intent.
      const newCommandId = generateId();
      await resubmitRejectedCommand(db, {
        originalCommandId: commandId,
        newCommandId,
        ...(editedPayload !== undefined && { payload: editedPayload }),
      });
      await refresh();
      return newCommandId;
    },
    [db, refresh],
  );

  return { changes, isLoading, error, refresh, discard, resubmit };
}

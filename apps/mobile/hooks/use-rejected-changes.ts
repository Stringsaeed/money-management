import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useDatabase } from "@/db/client";
import { useActiveHousehold } from "@/hooks/use-households";
import { authClient } from "@/lib/auth-client";
import {
  discardRejectedCommand,
  listRejectedChanges,
  resubmitRejectedCommand,
  type RejectedChange,
} from "@/lib/sync/outbox";
import { cohereOutboxSettlement } from "@/modules/ledger-cache";
import { generateId } from "@/utils/id";

/**
 * Rejected Changes inbox state (#94): lists every command the server refused
 * for the active household and exposes the re-edit/resubmit and discard
 * flows. Resubmission always mints a NEW commandId so the edited intent is a
 * fresh idempotency key.
 */
export function useRejectedChanges() {
  const db = useDatabase();
  const queryClient = useQueryClient();
  const { activeHousehold } = useActiveHousehold();
  const { data: session } = authClient.useSession();
  const householdId = activeHousehold?.householdId ?? null;
  const userId = session?.user.id ?? null;

  const [changes, setChanges] = useState<readonly RejectedChange[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!householdId || !userId) {
      setChanges([]);
      setIsLoading(false);
      return;
    }
    try {
      setChanges(await listRejectedChanges(db, householdId, userId));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Could not load rejected changes."));
    } finally {
      setIsLoading(false);
    }
  }, [db, householdId, userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const discard = useCallback(
    async (commandId: string) => {
      await discardRejectedCommand(db, commandId);
      await cohereOutboxSettlement(queryClient);
      await refresh();
    },
    [db, queryClient, refresh],
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
      await cohereOutboxSettlement(queryClient);
      await refresh();
      return newCommandId;
    },
    [db, queryClient, refresh],
  );

  return { changes, isLoading, error, refresh, discard, resubmit };
}

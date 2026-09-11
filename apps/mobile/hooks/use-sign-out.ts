import { useCallback, useState } from "react";

import { connectPowerSync, peekPowerSyncDatabase } from "@/modules/powersync/database";
import { signedInUserId, useAccess } from "@/modules/access";

const UPLOAD_DRAIN_POLL_MS = 500;
const UPLOAD_DRAIN_TIMEOUT_MS = 120_000;

async function readPendingUploadCount(): Promise<number> {
  const database = peekPowerSyncDatabase();
  if (!database) return 0;
  const stats = await database.getUploadQueueStats();
  return stats.count;
}

async function waitForUploadQueueDrain(userId: string): Promise<void> {
  await connectPowerSync(userId);
  const deadline = Date.now() + UPLOAD_DRAIN_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const pending = await readPendingUploadCount();
    if (pending === 0) return;
    await new Promise((resolve) => setTimeout(resolve, UPLOAD_DRAIN_POLL_MS));
  }
  throw new Error("Sync is taking longer than expected. Try again or discard pending edits.");
}

/**
 * Gates sign-out when PowerSync still has pending uploads (#229).
 */
export function useSignOutRequest() {
  const access = useAccess();
  const userId = signedInUserId(access);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestSignOut = useCallback(async () => {
    if (access.kind !== "signed_in") return;
    setError(null);
    const pending = await readPendingUploadCount();
    if (pending > 0) {
      setPendingCount(pending);
      setSheetOpen(true);
      return;
    }
    await access.signOut();
  }, [access]);

  const cancelSignOut = useCallback(() => {
    setSheetOpen(false);
    setError(null);
  }, []);

  const discardAndSignOut = useCallback(async () => {
    if (access.kind !== "signed_in") return;
    setBusy(true);
    setError(null);
    try {
      setSheetOpen(false);
      await access.signOut();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign out.");
    } finally {
      setBusy(false);
    }
  }, [access]);

  const syncThenSignOut = useCallback(async () => {
    if (access.kind !== "signed_in" || !userId) return;
    setBusy(true);
    setError(null);
    try {
      await waitForUploadQueueDrain(userId);
      setSheetOpen(false);
      await access.signOut();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not finish syncing before sign-out.");
    } finally {
      setBusy(false);
    }
  }, [access, userId]);

  return {
    requestSignOut,
    cancelSignOut,
    syncThenSignOut,
    discardAndSignOut,
    sheetOpen,
    pendingCount,
    busy,
    error,
  };
}

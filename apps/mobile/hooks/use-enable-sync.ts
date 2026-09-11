import { useCallback, useRef, useState } from "react";
import { useSQLiteContext } from "@/db/sqlite";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import type { ImportManifest } from "@trove/protocol";

import { useDatabase } from "@/db/client";
import { backupLocalDatabase } from "@/lib/migration/backup";
import { runImport } from "@/lib/migration/enable-sync";
import {
  getMigratedHouseholdId,
  getSyncEnrollment,
  markMigrationCompleted,
  markPersonalSyncEnabled,
} from "@/lib/migration/status";
import { describeRejection, parseRejection } from "@/modules/powersync/rejection";
import { orpc } from "@/lib/server/orpc";
import { signedInUserId, useAccess } from "@/modules/access";
import { connectPowerSync } from "@/modules/powersync/database";
import { useSyncModeStore } from "@/stores/sync-mode-store";
import { generateId } from "@/utils/id";

export type EnableSyncStatus =
  | "idle"
  | "creating_household"
  | "backing_up"
  | "uploading"
  | "verifying"
  | "matched"
  | "mismatched"
  | "error";

export interface ImportDiscrepancy {
  readonly localManifest: ImportManifest;
  readonly serverManifest: ImportManifest;
}

export interface EnableSyncInput {
  /** Name for a brand-new household; ignored when `householdId` is given. */
  householdName?: string;
  /** An already-created household (e.g. one the user joined) to import into. */
  householdId?: string;
}

/**
 * Drives the "Enable Sync" local-to-cloud migration (#98) end to end:
 * creates the household if needed, backs up the pre-import SQLite file,
 * uploads every local row via {@link runImport}, and — only once the
 * server's recomputed manifest matches — waits for the first PowerSync
 * household stream and flips this device to synced mode.
 *
 * A rejected chunk or a manifest mismatch leaves the household, the backup,
 * and sync mode untouched: the import is paused, not rolled back, so the
 * discrepancy stays inspectable instead of silently retrying.
 */
export function useEnableSync() {
  const db = useDatabase();
  const sqlite = useSQLiteContext();
  const queryClient = useQueryClient();
  const userId = signedInUserId(useAccess());
  const [status, setStatus] = useState<EnableSyncStatus>("idle");
  const [error, setError] = useState<Error | null>(null);
  const [discrepancy, setDiscrepancy] = useState<ImportDiscrepancy | null>(null);
  // Retrying (a rejected chunk or a manifest mismatch) must reuse the household
  // created on the first attempt instead of creating another one every tap.
  const createdHouseholdIdRef = useRef<string | null>(null);
  const createRequestIdRef = useRef(generateId());

  const enableSync = useCallback(
    async (input: EnableSyncInput) => {
      setError(null);
      setDiscrepancy(null);
      try {
        let householdId = input.householdId ?? createdHouseholdIdRef.current;
        if (!householdId) {
          setStatus("creating_household");
          const created = await orpc.households.create({
            name: input.householdName?.trim() || "My Household",
            requestId: createRequestIdRef.current,
          });
          householdId = created.householdId;
          createdHouseholdIdRef.current = householdId;
        }

        setStatus("backing_up");
        await backupLocalDatabase(sqlite);

        setStatus("uploading");
        const result = await runImport({
          db,
          householdId,
          sendCommand: (envelope) =>
            orpc.commands.apply({
              ...envelope,
              preconditions: envelope.preconditions?.map((precondition) => ({ ...precondition })),
            }),
          fetchManifest: (id) => orpc.migration.getManifest({ householdId: id }),
          connectAndWait: async (id) => {
            if (!userId) throw new Error("Sign in again before finishing PowerSync migration.");
            const powerSync = await connectPowerSync(userId);
            const subscription = await powerSync
              .syncStream("household_ledger", { household_id: id })
              .subscribe();
            try {
              await subscription.waitForFirstSync();
            } finally {
              await subscription.unsubscribe();
            }
          },
        });

        if (result.status === "rejected") {
          setStatus("error");
          const rejection = parseRejection(result.result);
          const detail = rejection ? describeRejection(rejection) : result.result.kind;
          setError(
            new Error(
              `Import paused while uploading "${result.entityType}" (chunk ${result.chunkIndex + 1}): ${detail}`,
            ),
          );
          return;
        }
        if (result.status === "mismatched") {
          setStatus("mismatched");
          setDiscrepancy({
            localManifest: result.localManifest,
            serverManifest: result.serverManifest,
          });
          return;
        }

        setStatus("verifying");
        await markMigrationCompleted(db, householdId);
        useSyncModeStore.getState().setSynced();

        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["households"] }),
          queryClient.invalidateQueries({ queryKey: ["household"] }),
          queryClient.invalidateQueries({ queryKey: ["migration"] }),
        ]);

        setStatus("matched");
      } catch (err) {
        setStatus("error");
        setError(err instanceof Error ? err : new Error("Enable Sync failed."));
      }
    },
    [db, queryClient, sqlite, userId],
  );

  return { status, error, discrepancy, enableSync };
}

/** The household id this device has already migrated into, or null if none. */
export function useMigratedHouseholdId() {
  const db = useDatabase();
  return useQuery({
    queryKey: ["migration", "completedHouseholdId"],
    queryFn: () => getMigratedHouseholdId(db),
  });
}

/** Both sync opt-ins this device holds: a migrated Household and/or a Personal Ledger. */
export function useSyncEnrollment() {
  const db = useDatabase();
  return useQuery({
    queryKey: ["migration", "syncEnrollment"],
    queryFn: () => getSyncEnrollment(db),
  });
}

export type PersonalSyncStatus = "idle" | "connecting" | "enabled" | "error";

/**
 * Turns on Personal Ledger sync (#226) for the signed-in User.
 *
 * Unlike {@link useEnableSync} this creates no Household and uploads nothing:
 * the cloud ledger starts empty and this device's existing local rows stay
 * exactly where they are, readable again the moment sync is turned back off.
 */
export function useEnablePersonalSync() {
  const db = useDatabase();
  const queryClient = useQueryClient();
  const userId = signedInUserId(useAccess());
  const [status, setStatus] = useState<PersonalSyncStatus>("idle");
  const [error, setError] = useState<Error | null>(null);

  const enablePersonalSync = useCallback(async () => {
    setError(null);
    if (!userId) {
      setStatus("error");
      setError(new Error("Sign in before turning on sync for your personal ledger."));
      return;
    }
    try {
      setStatus("connecting");
      // personal_ledger auto-subscribes, so the database-level first sync is
      // the only signal that the empty ledger has arrived.
      const powerSync = await connectPowerSync(userId);
      await powerSync.waitForFirstSync();

      await markPersonalSyncEnabled(db, userId);
      useSyncModeStore.getState().setSynced();
      await queryClient.invalidateQueries({ queryKey: ["migration"] });
      setStatus("enabled");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err : new Error("Could not turn on personal sync."));
    }
  }, [db, queryClient, userId]);

  return { status, error, enablePersonalSync };
}

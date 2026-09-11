import { useCallback, useRef, useState } from "react";

import { useSQLiteContext } from "@/db/sqlite";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import type { ImportManifest } from "@trove/protocol";

import { useDatabase } from "@/db/client";
import { backupLocalDatabase } from "@/lib/migration/backup";
import { runImport } from "@/lib/migration/enable-sync";
import { householdImportBinding, personalImportBinding } from "@/lib/migration/import-binding";
import { isImportManifestEmpty, localLedgerHasImportRows } from "@/lib/migration/manifest-utils";
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
            requestId: generateId(),
          });
          householdId = created.householdId;
          createdHouseholdIdRef.current = householdId;
        }

        setStatus("backing_up");
        await backupLocalDatabase(sqlite);

        setStatus("uploading");
        const result = await runImport({
          db,
          binding: householdImportBinding(householdId),
          sendCommand: (envelope) =>
            orpc.commands.apply({
              ...envelope,
              preconditions: envelope.preconditions?.map((precondition) => ({ ...precondition })),
            }),
          fetchManifest: () => orpc.migration.getManifest({ householdId }),
          connectAndWait: async () => {
            if (!userId) throw new Error("Sign in again before finishing PowerSync migration.");
            const powerSync = await connectPowerSync(userId);
            const subscription = await powerSync
              .syncStream("household_ledger", { household_id: householdId })
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

export type PersonalSyncStatus =
  | "idle"
  | "probing"
  | "confirm_upload"
  | "backing_up"
  | "uploading"
  | "verifying"
  | "connecting"
  | "enabled"
  | "error";

export type PersonalCloudMode = "empty" | "populated" | null;

/**
 * Personal Ledger sync (#226 / #229): probe the cloud, optionally confirm a
 * one-time upload from this device, or open an already-populated cloud while
 * keeping the independent local SQLite ledger intact.
 */
export function useEnablePersonalSync() {
  const db = useDatabase();
  const sqlite = useSQLiteContext();
  const queryClient = useQueryClient();
  const userId = signedInUserId(useAccess());
  const [status, setStatus] = useState<PersonalSyncStatus>("idle");
  const [cloudMode, setCloudMode] = useState<PersonalCloudMode>(null);
  const [error, setError] = useState<Error | null>(null);

  const waitForPersonalFirstSync = useCallback(async () => {
    if (!userId) throw new Error("Sign in before turning on sync for your personal ledger.");
    const powerSync = await connectPowerSync(userId);
    await powerSync.waitForFirstSync();
  }, [userId]);

  const markPersonalReady = useCallback(async () => {
    if (!userId) throw new Error("Sign in before turning on sync for your personal ledger.");
    await markPersonalSyncEnabled(db, userId);
    useSyncModeStore.getState().setSynced();
    await queryClient.invalidateQueries({ queryKey: ["migration"] });
    setStatus("enabled");
  }, [db, queryClient, userId]);

  const finishPersonalEnrollment = useCallback(async () => {
    await waitForPersonalFirstSync();
    await markPersonalReady();
  }, [markPersonalReady, waitForPersonalFirstSync]);

  const runPersonalImport = useCallback(async () => {
    if (!userId) throw new Error("Sign in before uploading to your personal ledger.");
    setStatus("backing_up");
    await backupLocalDatabase(sqlite);
    setStatus("uploading");
    const binding = personalImportBinding(userId);
    const result = await runImport({
      db,
      binding,
      sendCommand: (envelope) =>
        orpc.commands.apply({
          ...envelope,
          preconditions: envelope.preconditions?.map((precondition) => ({ ...precondition })),
        }),
      fetchManifest: () => orpc.migration.getManifest({ scope: "personal" }),
      // First sync only — enroll after manifests match so a mismatch stays recoverable.
      connectAndWait: waitForPersonalFirstSync,
    });
    if (result.status === "rejected") {
      const rejection = parseRejection(result.result);
      const detail = rejection ? describeRejection(rejection) : result.result.kind;
      throw new Error(
        `Import paused while uploading "${result.entityType}" (chunk ${result.chunkIndex + 1}): ${detail}`,
      );
    }
    if (result.status === "mismatched") {
      throw new Error(
        "Personal import finished but manifests did not match. Your backup is intact.",
      );
    }
    setStatus("verifying");
    await markPersonalReady();
  }, [db, markPersonalReady, sqlite, userId, waitForPersonalFirstSync]);

  const enablePersonalSync = useCallback(async () => {
    setError(null);
    if (!userId) {
      setStatus("error");
      setError(new Error("Sign in before turning on sync for your personal ledger."));
      return;
    }
    try {
      setStatus("probing");
      const [serverManifest, hasLocalRows] = await Promise.all([
        orpc.migration.getManifest({ scope: "personal" }),
        localLedgerHasImportRows(db),
      ]);
      const cloudEmpty = isImportManifestEmpty(serverManifest);
      if (!cloudEmpty) {
        setCloudMode("populated");
        setStatus("connecting");
        await finishPersonalEnrollment();
        return;
      }
      if (hasLocalRows) {
        setCloudMode("empty");
        setStatus("confirm_upload");
        return;
      }
      setCloudMode("empty");
      setStatus("connecting");
      await finishPersonalEnrollment();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err : new Error("Could not turn on personal sync."));
    }
  }, [db, finishPersonalEnrollment, userId]);

  const confirmPersonalUpload = useCallback(async () => {
    setError(null);
    try {
      await runPersonalImport();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err : new Error("Personal upload failed."));
    }
  }, [runPersonalImport]);

  const cancelPersonalUpload = useCallback(() => {
    setStatus("idle");
    setCloudMode(null);
    setError(null);
  }, []);

  return {
    status,
    cloudMode,
    error,
    enablePersonalSync,
    confirmPersonalUpload,
    cancelPersonalUpload,
  };
}

import { useCallback, useState } from "react";
import { useSQLiteContext } from "@/db/sqlite";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import type { ImportManifest } from "@trove/protocol";

import { useDatabase } from "@/db/client";
import { backupLocalDatabase } from "@/lib/migration/backup";
import { runImport } from "@/lib/migration/enable-sync";
import { getMigratedHouseholdId, markMigrationCompleted } from "@/lib/migration/status";
import { describeRejection, parseRejection } from "@/lib/sync/rejection";
import { pullDeltas, truncateOutbox } from "@/lib/sync/outbox";
import { orpc } from "@/lib/server/orpc";
import { useSyncModeStore } from "@/stores/sync-mode-store";

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
 * server's recomputed manifest matches — flips this device to synced mode,
 * truncates the outbox, and re-seeds the sync watermark from `since: 0`.
 *
 * A rejected chunk or a manifest mismatch leaves the household, the backup,
 * and sync mode untouched: the import is paused, not rolled back, so the
 * discrepancy stays inspectable instead of silently retrying.
 */
export function useEnableSync() {
  const db = useDatabase();
  const sqlite = useSQLiteContext();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<EnableSyncStatus>("idle");
  const [error, setError] = useState<Error | null>(null);
  const [discrepancy, setDiscrepancy] = useState<ImportDiscrepancy | null>(null);

  const enableSync = useCallback(
    async (input: EnableSyncInput) => {
      setError(null);
      setDiscrepancy(null);
      try {
        let householdId = input.householdId ?? null;
        if (!householdId) {
          setStatus("creating_household");
          const created = await orpc.households.create({
            name: input.householdName?.trim() || "My Household",
          });
          householdId = created.householdId;
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
        await truncateOutbox(db, householdId);
        await pullDeltas(db, (args) => orpc.sync.getDelta(args), householdId);
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
    [db, sqlite, queryClient],
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

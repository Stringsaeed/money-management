import type { EnableSyncStatus } from "@/hooks/use-enable-sync";

export const ENABLE_SYNC_IDLE_DESCRIPTION = "Back up your data and keep it in sync across devices.";

export const ENABLE_SYNC_MATCHED_DESCRIPTION = "Your data stays synced across devices.";

export const ENABLE_SYNC_MISMATCH_DESCRIPTION =
  "The upload didn't reconcile — your local data is unchanged. Try again.";

export const ENABLE_SYNC_STATUS_LABEL = {
  idle: "",
  creating_household: "Creating household…",
  backing_up: "Backing up your local data…",
  uploading: "Uploading your budget…",
  verifying: "Verifying…",
  matched: "Synced ☁️",
  mismatched: "Paused — data didn't reconcile",
  error: "Something went wrong",
} as const satisfies Record<EnableSyncStatus, string>;

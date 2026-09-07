import { create } from "zustand";

/**
 * Client sync mode (#99). `synced` is the normal state; `local_only` means
 * every write stays on this device — either because the server's remote
 * `kill_switch_local_only` flag is engaged, or because PowerSync has been
 * disconnected for 10+ minutes (graceful degradation).
 */
export type SyncMode = "synced" | "local_only";

export type LocalOnlyReason = "kill_switch" | "powersync_unavailable";

interface SyncModeState {
  mode: SyncMode;
  /** Why the app is in local-only mode; null while synced. */
  reason: LocalOnlyReason | null;

  setLocalOnly: (reason: LocalOnlyReason) => void;
  setSynced: () => void;
}

export const useSyncModeStore = create<SyncModeState>((set) => ({
  mode: "synced",
  reason: null,

  setLocalOnly: (reason) => set({ mode: "local_only", reason }),
  setSynced: () => set({ mode: "synced", reason: null }),
}));

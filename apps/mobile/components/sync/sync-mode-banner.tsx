import { Text } from "react-native";

import { BANNER_TOAST_IDS } from "@/components/banner/banner-channel";
import { syncFingerprint } from "@/components/banner/banner-fingerprint";
import { markBannerDismissed, useSyncBannerToast } from "@/components/banner/use-sync-banner-toast";
import { toast } from "@/lib/sonner";
import { useSyncModeStore } from "@/stores/sync-mode-store";

/**
 * Persistent mode indicator (#99): while the app is in local-only mode —
 * remote kill switch engaged or PowerSync disconnected for 10+ minutes —
 * a toast makes the state unmistakable. In normal synced mode the toast
 * is absent; the ledger simply looks and behaves as usual.
 */
export function SyncModeBanner() {
  const mode = useSyncModeStore((state) => state.mode);
  const reason = useSyncModeStore((state) => state.reason);
  const fingerprint = mode === "local_only" && reason != null ? syncFingerprint(reason) : null;

  useSyncBannerToast({
    channel: "sync",
    fingerprint,
    present: () => {
      if (reason == null) return;
      const activeFingerprint = syncFingerprint(reason);
      const killSwitch = reason === "kill_switch";
      toast.info("Local-only mode", {
        id: BANNER_TOAST_IDS.sync,
        description: killSwitch
          ? "Sync was paused remotely. Changes are saved on this device only."
          : "Can't reach the server right now. Changes are saved on this device only.",
        duration: Number.POSITIVE_INFINITY,
        position: "bottom-center",
        icon: <Text>📴</Text>,
        closeButton: true,
        onDismiss: () => markBannerDismissed("sync", activeFingerprint),
      });
    },
  });

  return null;
}

import { Text } from "react-native";

import { BANNER_TOAST_IDS } from "@/components/banner/banner-channel";
import { accessFingerprint } from "@/components/banner/banner-fingerprint";
import { markBannerDismissed, useSyncBannerToast } from "@/components/banner/use-sync-banner-toast";
import { toast } from "@/lib/sonner";
import { returnTo, useAccess } from "@/modules/access";

export function AccessBanner() {
  const access = useAccess();
  const fingerprint =
    access.kind === "session_revoked" ? accessFingerprint("session_revoked") : null;

  useSyncBannerToast({
    channel: "access",
    fingerprint,
    present: () => {
      if (access.kind !== "session_revoked") return;
      const activeFingerprint = accessFingerprint("session_revoked");
      toast.warning("Signed out remotely", {
        id: BANNER_TOAST_IDS.access,
        description: "Your ledger is safe on this device.",
        duration: Number.POSITIVE_INFINITY,
        icon: <Text>🔐</Text>,
        closeButton: true,
        onDismiss: () => markBannerDismissed("access", activeFingerprint),
        action: {
          label: "Sign in again",
          onClick: () => access.reauthenticate(returnTo.current()),
        },
      });
    },
  });

  return null;
}

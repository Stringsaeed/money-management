import { useEffect, useEffectEvent } from "react";

import { BANNER_TOAST_IDS, type BannerChannel } from "@/components/banner/banner-channel";
import { toast } from "@/lib/sonner";
import { useBannerDismissStore } from "@/stores/banner-dismiss-store";

interface SyncBannerToastOptions {
  channel: BannerChannel;
  fingerprint: string | null;
  present: () => void;
}

/**
 * Keeps a stable toast id in sync with an incident fingerprint.
 * Dismiss is presentation-only; callers must not clear domain state in `present`.
 */
export function useSyncBannerToast({ channel, fingerprint, present }: SyncBannerToastOptions) {
  const presentEvent = useEffectEvent(present);
  const toastId = BANNER_TOAST_IDS[channel];

  useEffect(() => {
    const { forget, isDismissed } = useBannerDismissStore.getState();

    if (fingerprint == null) {
      toast.dismiss(toastId);
      forget(channel);
      return;
    }

    if (isDismissed(channel, fingerprint)) {
      return;
    }

    presentEvent();
  }, [channel, fingerprint, toastId]);
}

export function markBannerDismissed(channel: BannerChannel, fingerprint: string) {
  useBannerDismissStore.getState().dismiss(channel, fingerprint);
}

export function forgetBannerDismiss(channel: BannerChannel) {
  useBannerDismissStore.getState().forget(channel);
}

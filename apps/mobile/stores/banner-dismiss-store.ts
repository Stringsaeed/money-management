import { create } from "zustand";

import type { BannerChannel } from "@/components/banner/banner-channel";

interface BannerDismissState {
  dismissedByChannel: Partial<Record<BannerChannel, string>>;
  dismiss: (channel: BannerChannel, fingerprint: string) => void;
  forget: (channel: BannerChannel) => void;
  isDismissed: (channel: BannerChannel, fingerprint: string) => boolean;
}

export const useBannerDismissStore = create<BannerDismissState>((set, get) => ({
  dismissedByChannel: {},
  dismiss: (channel, fingerprint) =>
    set((state) => ({
      dismissedByChannel: { ...state.dismissedByChannel, [channel]: fingerprint },
    })),
  forget: (channel) =>
    set((state) => {
      if (state.dismissedByChannel[channel] == null) return state;
      const dismissedByChannel = { ...state.dismissedByChannel };
      delete dismissedByChannel[channel];
      return { dismissedByChannel };
    }),
  isDismissed: (channel, fingerprint) => get().dismissedByChannel[channel] === fingerprint,
}));

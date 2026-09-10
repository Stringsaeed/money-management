import { render } from "@testing-library/react-native";

import { SyncModeBanner } from "@/components/sync/sync-mode-banner";
import { BANNER_TOAST_IDS } from "@/components/banner/banner-channel";
import { toast } from "@/lib/sonner";
import { useBannerDismissStore } from "@/stores/banner-dismiss-store";
import { useSyncModeStore } from "@/stores/sync-mode-store";

describe("SyncModeBanner", () => {
  beforeEach(() => {
    useSyncModeStore.setState({ mode: "synced", reason: null });
  });

  it("dismisses the sync toast in synced mode", async () => {
    await render(<SyncModeBanner />);
    expect(toast.dismiss).toHaveBeenCalledWith(BANNER_TOAST_IDS.sync);
    expect(toast.info).not.toHaveBeenCalled();
  });

  it("presents a persistent kill-switch local-only toast", async () => {
    useSyncModeStore.setState({ mode: "local_only", reason: "kill_switch" });
    await render(<SyncModeBanner />);

    expect(toast.info).toHaveBeenCalledWith(
      "Local-only mode",
      expect.objectContaining({
        id: BANNER_TOAST_IDS.sync,
        description: expect.stringMatching(/paused remotely/),
        duration: Number.POSITIVE_INFINITY,
        position: "bottom-center",
      }),
    );
  });

  it("presents a disconnected local-only toast", async () => {
    useSyncModeStore.setState({ mode: "local_only", reason: "powersync_unavailable" });
    await render(<SyncModeBanner />);

    expect(toast.info).toHaveBeenCalledWith(
      "Local-only mode",
      expect.objectContaining({
        description: expect.stringMatching(/Can't reach the server/),
      }),
    );
  });

  it("does not re-present after the same incident is dismissed", async () => {
    useSyncModeStore.setState({ mode: "local_only", reason: "kill_switch" });
    useBannerDismissStore.getState().dismiss("sync", "local_only:kill_switch");

    await render(<SyncModeBanner />);

    expect(toast.info).not.toHaveBeenCalled();
  });
});

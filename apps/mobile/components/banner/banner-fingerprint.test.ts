import {
  accessFingerprint,
  settlementFingerprint,
  syncFingerprint,
} from "@/components/banner/banner-fingerprint";
import { useBannerDismissStore } from "@/stores/banner-dismiss-store";

describe("banner fingerprints and dismiss memory", () => {
  it("builds stable fingerprints per channel", () => {
    expect(accessFingerprint("session_revoked")).toBe("session_revoked");
    expect(syncFingerprint("kill_switch")).toBe("local_only:kill_switch");
    expect(
      settlementFingerprint({
        report: {
          localDate: "2026-09-10",
          startedAt: "t1",
          finishedAt: "t2",
          generatedCount: 2,
          totalMinor: 0,
          rules: [],
          effects: [],
        },
        error: null,
        unresolved: false,
      }),
    ).toBe("success:t1:2");
  });

  it("remembers dismissals until the fingerprint changes", () => {
    const store = useBannerDismissStore.getState();
    store.dismiss("sync", "local_only:kill_switch");
    expect(store.isDismissed("sync", "local_only:kill_switch")).toBe(true);
    expect(store.isDismissed("sync", "local_only:powersync_unavailable")).toBe(false);
    store.forget("sync");
    expect(store.isDismissed("sync", "local_only:kill_switch")).toBe(false);
  });
});

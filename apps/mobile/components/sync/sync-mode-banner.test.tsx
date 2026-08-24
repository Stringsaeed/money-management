import { render, screen } from "@testing-library/react-native";

import { SyncModeBanner } from "@/components/sync/sync-mode-banner";
import { useSyncModeStore } from "@/stores/sync-mode-store";

describe("SyncModeBanner", () => {
  beforeEach(() => {
    useSyncModeStore.setState({ mode: "synced", reason: null });
  });

  it("renders nothing in synced mode", async () => {
    await render(<SyncModeBanner />);
    expect(screen.queryByText("Local-only mode")).not.toBeOnTheScreen();
  });

  it("explains remote kill-switch local-only mode", async () => {
    useSyncModeStore.setState({ mode: "local_only", reason: "kill_switch" });
    await render(<SyncModeBanner />);

    expect(screen.getByText("Local-only mode")).toBeOnTheScreen();
    expect(screen.getByText(/paused remotely/)).toBeOnTheScreen();
  });

  it("explains degraded local-only mode after delta pulls became unavailable", async () => {
    useSyncModeStore.setState({ mode: "local_only", reason: "delta_unavailable" });
    await render(<SyncModeBanner />);

    expect(screen.getByText("Local-only mode")).toBeOnTheScreen();
    expect(screen.getByText(/Can't reach the server/)).toBeOnTheScreen();
  });
});

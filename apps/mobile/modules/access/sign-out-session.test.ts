import { QueryClient } from "@tanstack/react-query";

import { runSignedOutSessionCleanup } from "@/modules/access/sign-out-session";
import { useSyncModeStore } from "@/stores/sync-mode-store";

const mockDisconnect = jest.fn(async () => undefined);
const mockClearEnrollment = jest.fn(async (_db?: unknown) => undefined);
const mockRemoteSignOut = jest.fn(async () => undefined);
const mockClearLedger = jest.fn(async (_userId?: unknown) => undefined);
const mockClearClaim = jest.fn(async () => undefined);

jest.mock("@/modules/powersync/database", () => ({
  disconnectAndClearPowerSync: () => mockDisconnect(),
}));

jest.mock("@/lib/migration/status", () => ({
  clearAllSyncEnrollment: (db: unknown) => mockClearEnrollment(db),
}));

jest.mock("@/modules/access/session-probe", () => ({
  tryRemoteSignOut: () => mockRemoteSignOut(),
}));

jest.mock("@/modules/access/ledger-selection-store", () => ({
  clearLedgerSelection: (userId: unknown) => mockClearLedger(userId),
}));

jest.mock("@/modules/access/claim-store", () => ({
  clearClaim: () => mockClearClaim(),
}));

describe("runSignedOutSessionCleanup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSyncModeStore.setState({ mode: "synced", reason: null });
  });

  it("clears PowerSync, sync enrollment, claim, selection, and query caches for identity switch", async () => {
    const queryClient = new QueryClient();
    const removeQueries = jest.spyOn(queryClient, "removeQueries");
    const db = { __fake: true };

    await runSignedOutSessionCleanup({
      db: db as never,
      queryClient,
      userId: "user-1",
    });

    expect(mockDisconnect).toHaveBeenCalledTimes(1);
    expect(mockClearEnrollment).toHaveBeenCalledWith(db);
    expect(useSyncModeStore.getState().mode).toBe("local_only");
    expect(useSyncModeStore.getState().reason).toBe("powersync_unavailable");
    expect(mockRemoteSignOut).toHaveBeenCalledTimes(1);
    expect(mockClearLedger).toHaveBeenCalledWith("user-1");
    expect(mockClearClaim).toHaveBeenCalledTimes(1);
    expect(removeQueries).toHaveBeenCalledWith({ queryKey: ["households"] });
    expect(removeQueries).toHaveBeenCalledWith({ queryKey: ["household"] });
    expect(removeQueries).toHaveBeenCalledWith({ queryKey: ["migration"] });
    expect(removeQueries).toHaveBeenCalledWith({ queryKey: ["sync"] });
  });

  it("skips ledger selection clear when there is no user id", async () => {
    const queryClient = new QueryClient();

    await runSignedOutSessionCleanup({
      db: {} as never,
      queryClient,
      userId: null,
    });

    expect(mockClearLedger).not.toHaveBeenCalled();
    expect(mockClearClaim).toHaveBeenCalledTimes(1);
  });
});

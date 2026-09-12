import { act, renderHook, waitFor } from "@testing-library/react-native";

import { useSignOutRequest } from "@/hooks/use-sign-out";

const mockPeek = jest.fn();
const mockConnect = jest.fn();
const mockUseAccess = jest.fn();
const mockSignedInUserId = jest.fn();

jest.mock("@/modules/powersync/database", () => ({
  peekPowerSyncDatabase: () => mockPeek(),
  connectPowerSync: (...args: unknown[]) => mockConnect(...args),
}));

jest.mock("@/modules/access", () => ({
  useAccess: () => mockUseAccess(),
  signedInUserId: (access: unknown) => mockSignedInUserId(access),
}));

function signedIn(signOut: jest.Mock) {
  return {
    kind: "signed_in" as const,
    user: { userId: "user-1", email: "user@example.com", displayName: "User" },
    household: { kind: "none" as const },
    memberships: [],
    selection: { kind: "personal" as const },
    setActiveHousehold: jest.fn(async () => undefined),
    signOut,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockPeek.mockReturnValue(null);
  mockConnect.mockResolvedValue(undefined);
  mockSignedInUserId.mockImplementation(
    (access: { kind: string; user?: { userId: string } }) =>
      access.kind === "signed_in" ? (access.user?.userId ?? null) : null,
  );
});

describe("useSignOutRequest", () => {
  it("signs out immediately when the upload queue is empty", async () => {
    const signOut = jest.fn(async () => undefined);
    mockUseAccess.mockReturnValue(signedIn(signOut));

    const { result } = await renderHook(() => useSignOutRequest());

    await act(async () => {
      await result.current.requestSignOut();
    });

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(result.current.sheetOpen).toBe(false);
  });

  it("opens the sync-or-discard sheet when uploads are still pending", async () => {
    const signOut = jest.fn(async () => undefined);
    mockUseAccess.mockReturnValue(signedIn(signOut));
    mockPeek.mockReturnValue({
      getUploadQueueStats: jest.fn(async () => ({ count: 3 })),
    });

    const { result } = await renderHook(() => useSignOutRequest());

    await act(async () => {
      await result.current.requestSignOut();
    });

    expect(signOut).not.toHaveBeenCalled();
    expect(result.current.sheetOpen).toBe(true);
    expect(result.current.pendingCount).toBe(3);
  });

  it("discardAndSignOut signs out without waiting for the queue", async () => {
    const signOut = jest.fn(async () => undefined);
    mockUseAccess.mockReturnValue(signedIn(signOut));
    mockPeek.mockReturnValue({
      getUploadQueueStats: jest.fn(async () => ({ count: 2 })),
    });

    const { result } = await renderHook(() => useSignOutRequest());

    await act(async () => {
      await result.current.requestSignOut();
    });
    await act(async () => {
      await result.current.discardAndSignOut();
    });

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(result.current.sheetOpen).toBe(false);
    expect(mockConnect).not.toHaveBeenCalled();
  });

  it("syncThenSignOut drains the queue then signs out", async () => {
    jest.useFakeTimers();
    const signOut = jest.fn(async () => undefined);
    mockUseAccess.mockReturnValue(signedIn(signOut));
    const getUploadQueueStats = jest
      .fn()
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValue({ count: 0 });
    mockPeek.mockReturnValue({ getUploadQueueStats });

    const { result } = await renderHook(() => useSignOutRequest());

    await act(async () => {
      await result.current.requestSignOut();
    });
    await act(async () => {
      const p = result.current.syncThenSignOut();
      await jest.advanceTimersByTimeAsync(600);
      await p;
    });

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(mockConnect).toHaveBeenCalledWith("user-1");
    expect(result.current.sheetOpen).toBe(false);
    jest.useRealTimers();
  });
});

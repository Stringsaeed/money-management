import { act, waitFor } from "@testing-library/react-native";

import { useSyncDeltas } from "@/hooks/use-sync";
import { renderHookWithProviders } from "@/tests/test-utils/render";

const mockGetDelta = jest.fn();
const mockUseSession = jest.fn();

jest.mock("@/lib/server/orpc", () => ({
  orpc: {
    sync: {
      getDelta: (...args: unknown[]) => mockGetDelta(...args),
    },
  },
}));

jest.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: () => mockUseSession(),
  },
}));

const HOUSEHOLD_ID = "household-1";

function mockSignedIn() {
  mockUseSession.mockReturnValue({ data: { user: { id: "user-1" } }, isPending: false });
}

describe("useSyncDeltas", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSignedIn();
  });

  it("pulls deltas since watermark 0 on first poll and reports the head seq", async () => {
    mockGetDelta.mockResolvedValue({
      seq: 3,
      hasMore: false,
      changes: [
        { seq: 1, effects: ["members"] },
        { seq: 2, effects: ["ledger", "balances"] },
        { seq: 3, effects: ["envelopes"] },
      ],
    });

    const { result } = await renderHookWithProviders(() => useSyncDeltas(HOUSEHOLD_ID));

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    expect(mockGetDelta).toHaveBeenCalledWith({ householdId: HOUSEHOLD_ID, since: 0 });
    expect(result.current.seq).toBe(3);
    expect(result.current.changes.map((c) => c.seq)).toEqual([1, 2, 3]);
    expect(result.current.hasMore).toBe(false);
  });

  it("advances the watermark so the next poll only requests unseen changes", async () => {
    let head = 0;
    mockGetDelta.mockImplementation(async ({ since }: { since: number }) => {
      // Simulate one new change landing per poll.
      head = Math.max(head, since) + 1;
      return {
        seq: head,
        hasMore: false,
        changes: [{ seq: head, effects: ["members"] }],
      };
    });

    const { result } = await renderHookWithProviders(() => useSyncDeltas(HOUSEHOLD_ID));

    // Initial mount poll starts at watermark 0.
    await waitFor(() => {
      expect(result.current.seq).toBe(1);
    });

    mockGetDelta.mockClear();

    await act(async () => {
      await result.current.refetch();
    });
    expect(mockGetDelta).toHaveBeenLastCalledWith({ householdId: HOUSEHOLD_ID, since: 1 });

    await act(async () => {
      await result.current.refetch();
    });
    expect(mockGetDelta).toHaveBeenLastCalledWith({ householdId: HOUSEHOLD_ID, since: 2 });
    expect(result.current.changes).toEqual([{ seq: 3, effects: ["members"] }]);
  });

  it("stays idle when signed out or without a household", async () => {
    mockUseSession.mockReturnValue({ data: null, isPending: false });

    const { result } = await renderHookWithProviders(() => useSyncDeltas(null));

    // Give any accidental auto-fetch a chance to fire.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });

    expect(mockGetDelta).not.toHaveBeenCalled();
    expect(result.current.changes).toEqual([]);
    expect(result.current.seq).toBe(0);
  });

  it("exposes a sync error without throwing to the caller", async () => {
    mockGetDelta.mockRejectedValue(new Error("network down"));

    const { result } = await renderHookWithProviders(() => useSyncDeltas(HOUSEHOLD_ID));

    await act(async () => {
      await result.current.refetch().catch(() => undefined);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.changes).toEqual([]);
  });
});

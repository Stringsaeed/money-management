import { renderHook, waitFor } from "@testing-library/react-native";

import { useRejectedChanges } from "@/hooks/use-rejected-changes";

const mockLedger: { current: unknown } = { current: null };
const mockActiveHousehold: { current: { householdId: string } | null } = { current: null };

jest.mock("@/modules/ledger-db/provider", () => ({
  useSyncedTransactionLedger: () => mockLedger.current,
}));

jest.mock("@/hooks/use-households", () => ({
  useActiveHousehold: () => ({ activeHousehold: mockActiveHousehold.current }),
}));

describe("useRejectedChanges", () => {
  beforeEach(() => {
    mockLedger.current = null;
    mockActiveHousehold.current = null;
  });

  // Regression for #193: opening the Inbox tab while the household is
  // local-only, anonymous, mid-migration, or before PowerSync connects must
  // not crash the app — it previously threw synchronously during render via
  // useRequiredLedger, with no error boundary to catch it.
  it("does not throw and reports an empty inbox when no ledger is available", async () => {
    const { result } = await renderHook(() => useRejectedChanges());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.changes).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("rejects discard/resubmit instead of crashing when no ledger is available", async () => {
    const { result } = await renderHook(() => useRejectedChanges());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await expect(result.current.discard("cmd-1")).rejects.toThrow();
    await expect(result.current.resubmit("cmd-1")).rejects.toThrow();
  });
});

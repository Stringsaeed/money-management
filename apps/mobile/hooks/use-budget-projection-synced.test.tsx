import { waitFor } from "@testing-library/react-native";

import { useBudgetProjection } from "@/hooks/use-budget-workspaces";
import { renderHookWithProviders } from "@/tests/test-utils/render";

const mockGetProjection = jest.fn();

jest.mock("@/hooks/use-budgeting-coordinator", () => ({
  useBudgetingCoordinator: () => ({
    getProjection: (...args: unknown[]) => mockGetProjection(...args),
  }),
}));

describe("useBudgetProjection synced", () => {
  beforeEach(() => {
    mockGetProjection.mockResolvedValue({
      currency: "USD",
      period: "2026-03",
      fundingPool: { amountMinor: 0, currency: "USD" },
      envelopes: [],
    });
  });

  it("loads the projection through the selected PowerSync-aware coordinator", async () => {
    const { result } = await renderHookWithProviders(() => useBudgetProjection("USD", "2026-03"), {
      ledgerSelection: {
        kind: "synced",
        householdId: "household-1",
        offlineState: { kind: "offline_cached", reason: "kill_switch" },
      },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toMatchObject({ currency: "USD", period: "2026-03" });
    expect(mockGetProjection).toHaveBeenCalledWith({ currency: "USD", period: "2026-03" });
  });
});

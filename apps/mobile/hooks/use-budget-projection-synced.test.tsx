import { waitFor } from "@testing-library/react-native";

import { useBudgetProjection } from "@/hooks/use-budget-workspaces";
import { renderHookWithProviders } from "@/tests/test-utils/render";

const mockGetProjection = jest.fn();

jest.mock("@/db/sqlite", () => ({
  useSQLiteContext: () => ({ raw: "poisoned-sqlite" }),
}));

jest.mock("@/modules/budgeting/budgeting", () => ({
  createBudgetingCoordinator: () => ({
    getProjection: (...args: unknown[]) => mockGetProjection(...args),
  }),
}));

describe("useBudgetProjection synced fail-closed", () => {
  beforeEach(() => {
    mockGetProjection.mockResolvedValue({
      currency: "USD",
      period: "2026-03",
      fundingPool: { amountMinor: 0, currency: "USD" },
      envelopes: [],
    });
  });

  it("does not treat poisoned local A/C/T as $0 money while synced", async () => {
    const { result } = await renderHookWithProviders(() => useBudgetProjection("USD", "2026-03"), {
      ledgerSelection: {
        kind: "synced",
        householdId: "household-1",
        offlineState: { kind: "offline_cached", reason: "kill_switch" },
      },
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toMatch(/unavailable for the synced ledger/);
    expect(result.current.data).toBeUndefined();
    expect(mockGetProjection).not.toHaveBeenCalled();
  });
});

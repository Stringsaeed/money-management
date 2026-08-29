import { renderHook, waitFor } from "@testing-library/react-native";

import { useAccountVisibility } from "@/hooks/use-account-visibility";

const mockUseActiveHousehold = jest.fn();
const mockUseLedgerAccounts = jest.fn();

jest.mock("@/hooks/use-households", () => ({
  useActiveHousehold: () => mockUseActiveHousehold(),
}));

jest.mock("@/hooks/use-authorized-ledger-accounts", () => ({
  useAuthorizedLedgerAccounts: (...args: unknown[]) => mockUseLedgerAccounts(...args),
}));

describe("useAccountVisibility", () => {
  it("fails closed to the server-visible accounts for an active household", async () => {
    mockUseActiveHousehold.mockReturnValue({ activeHousehold: { householdId: "household-1" } });
    mockUseLedgerAccounts.mockReturnValue({ data: [{ id: "shared-account" }] });

    const { result } = await renderHook(() => useAccountVisibility());

    await waitFor(() => {
      expect(result.current.isFiltering).toBe(true);
    });
    expect(result.current.visibleAccountIds).toEqual(new Set(["shared-account"]));
  });
});

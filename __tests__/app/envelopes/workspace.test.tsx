import { fireEvent, render, screen } from "@testing-library/react-native";

import BudgetWorkspaceScreen from "@/app/(tabs)/envelopes/workspace";

const mockSelectWorkspace = jest.fn();
const mockUseBudgetWorkspaceSelection = jest.fn();

jest.mock("@/hooks/use-budget-workspaces", () => ({
  useBudgetWorkspaceSelection: () => mockUseBudgetWorkspaceSelection(),
  useSelectBudgetWorkspace: () => ({ mutate: mockSelectWorkspace, isPending: false }),
}));

describe("app/(tabs)/envelopes/workspace", () => {
  beforeEach(() => {
    mockSelectWorkspace.mockClear();
  });

  it("exposes the only currency workspace as the accessible selection", async () => {
    mockUseBudgetWorkspaceSelection.mockReturnValue({
      data: {
        workspaces: [{ currency: "USD", activationPeriod: "2026-08" }],
        homeCurrency: "USD",
        hasExplicitHomeCurrency: false,
        selectedCurrency: "USD",
      },
      isLoading: false,
      error: null,
    });

    await render(<BudgetWorkspaceScreen />);

    const workspace = screen.getByRole("radio", { name: "USD currency workspace" });
    expect(workspace.props.accessibilityState).toEqual({ disabled: false, selected: true });
  });

  it("selects among multiple workspaces without combining their Money", async () => {
    mockUseBudgetWorkspaceSelection.mockReturnValue({
      data: {
        workspaces: [
          { currency: "AED", activationPeriod: "2026-08" },
          { currency: "USD", activationPeriod: "2026-08" },
        ],
        homeCurrency: "USD",
        hasExplicitHomeCurrency: true,
        selectedCurrency: "USD",
      },
      isLoading: false,
      error: null,
    });

    await render(<BudgetWorkspaceScreen />);

    expect(
      screen.getByRole("radio", { name: "USD currency workspace" }).props.accessibilityState,
    ).toEqual({ disabled: false, selected: true });
    expect(
      screen.getByRole("radio", { name: "AED currency workspace" }).props.accessibilityState,
    ).toEqual({ disabled: false, selected: false });

    fireEvent.press(screen.getByRole("radio", { name: "AED currency workspace" }));

    expect(mockSelectWorkspace).toHaveBeenCalledWith({ currency: "AED" });
  });
});

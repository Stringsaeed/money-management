import { fireEvent, render, screen } from "@testing-library/react-native";

import RecurringListScreen from "@/app/recurring/index";
import { createRecurringRule } from "@/tests/test-utils/factories";

const mockPush = jest.fn();
const mockUseLocalSearchParams = jest.fn();
const mockUseRecurringRulesList = jest.fn();

jest.mock("expo-router", () => ({
  router: { push: (href: unknown) => mockPush(href) },
  useLocalSearchParams: () => mockUseLocalSearchParams(),
}));

jest.mock("@/hooks/use-recurring-rules", () => ({
  useRecurringRulesList: (filter: string) => mockUseRecurringRulesList(filter),
}));

describe("app/recurring/index", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockUseLocalSearchParams.mockReturnValue({});
    mockUseRecurringRulesList.mockReturnValue({ data: [], isLoading: false });
  });

  it("opens the requested filter from root feedback", async () => {
    mockUseLocalSearchParams.mockReturnValue({ filter: "needs_attention" });

    await render(<RecurringListScreen />);

    expect(mockUseRecurringRulesList).toHaveBeenCalledWith("needs_attention");
  });

  it("opens the new Rule form from the empty state", async () => {
    await render(<RecurringListScreen />);

    expect(mockUseRecurringRulesList).toHaveBeenCalledWith("current");
    fireEvent.press(screen.getByText("Add Recurring"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/recurring/[id]",
      params: { id: "new" },
    });
  });

  it("loads each filter and opens a Rule editor", async () => {
    mockUseRecurringRulesList.mockImplementation((filter: string) => ({
      data:
        filter === "needs_attention"
          ? [createRecurringRule({ id: "internet", name: "Internet", health: "needs_attention" })]
          : [],
      isLoading: false,
    }));

    await render(<RecurringListScreen />);
    fireEvent.press(screen.getByRole("button", { name: "Needs attention" }));
    fireEvent.press(await screen.findByText("Internet"));

    expect(mockUseRecurringRulesList).toHaveBeenLastCalledWith("needs_attention");
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/recurring/[id]",
      params: { id: "internet" },
    });
  });
});

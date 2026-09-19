import { fireEvent, render, screen } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

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

const initialWindowMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function Wrapper({ children }: { children: React.ReactNode }) {
  return <SafeAreaProvider initialMetrics={initialWindowMetrics}>{children}</SafeAreaProvider>;
}

describe("app/recurring/index", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockUseLocalSearchParams.mockReturnValue({});
    mockUseRecurringRulesList.mockReturnValue({ data: [], isLoading: false });
  });

  it("opens the requested filter from root feedback", async () => {
    mockUseLocalSearchParams.mockReturnValue({ filter: "needs_attention" });

    await render(<RecurringListScreen />, { wrapper: Wrapper });

    expect(mockUseRecurringRulesList).toHaveBeenCalledWith("needs_attention");
  });

  it("opens the new Rule form from the empty state", async () => {
    await render(<RecurringListScreen />, { wrapper: Wrapper });

    expect(mockUseRecurringRulesList).toHaveBeenCalledWith("current");
    fireEvent.press(screen.getByText("Add Recurring"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/transaction/[id]",
      params: { id: "new", recurring: "true" },
    });
  });

  it("opens the new Rule form from the accessible FAB", async () => {
    mockUseRecurringRulesList.mockReturnValue({
      data: [createRecurringRule({ id: "rent", name: "Rent" })],
      isLoading: false,
    });

    await render(<RecurringListScreen />, { wrapper: Wrapper });
    fireEvent.press(screen.getByRole("button", { name: "Add recurring rule" }));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/transaction/[id]",
      params: { id: "new", recurring: "true" },
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

    await render(<RecurringListScreen />, { wrapper: Wrapper });
    fireEvent.press(screen.getByRole("button", { name: "Needs attention" }));
    fireEvent.press(await screen.findByText("Internet"));

    expect(mockUseRecurringRulesList).toHaveBeenLastCalledWith("needs_attention");
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/transaction/[id]",
      params: { id: "internet", recurring: "true" },
    });
  });
});

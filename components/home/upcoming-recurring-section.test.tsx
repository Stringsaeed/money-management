import { fireEvent, render, screen } from "@testing-library/react-native";

import { UpcomingRecurringSection } from "@/components/home/upcoming-recurring-section";
import { createRecurringRule } from "@/tests/test-utils/factories";
import { formatCents } from "@/utils/currency";

const mockPush = jest.fn();
const mockUseUpcomingRecurringRules = jest.fn();

jest.mock("expo-router", () => ({
  router: { push: (href: unknown) => mockPush(href) },
}));

jest.mock("@/hooks/use-recurring-rules", () => ({
  useUpcomingRecurringRules: (limit: number) => mockUseUpcomingRecurringRules(limit),
}));

jest.mock("@/utils/date", () => ({
  ...jest.requireActual("@/utils/date"),
  today: () => "2026-03-28",
}));

describe("UpcomingRecurringSection", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockUseUpcomingRecurringRules.mockReturnValue({
      data: [],
      isError: false,
      isLoading: false,
    });
  });

  it("distinguishes a failed query from an empty schedule", async () => {
    mockUseUpcomingRecurringRules.mockReturnValue({ data: [], isError: true, isLoading: false });

    await render(<UpcomingRecurringSection />);

    expect(screen.getByText("Upcoming payments unavailable")).toBeOnTheScreen();
    expect(screen.queryByText("Nothing scheduled yet")).not.toBeOnTheScreen();
  });

  it("shows a compact prompt when no Rules exist", async () => {
    await render(<UpcomingRecurringSection />);

    expect(mockUseUpcomingRecurringRules).toHaveBeenCalledWith(3);
    expect(screen.getByText("Nothing scheduled yet")).toBeOnTheScreen();
    expect(screen.getByText(/Add a Recurring Rule/)).toBeOnTheScreen();

    fireEvent.press(screen.getByRole("button", { name: "Add a recurring rule" }));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/transaction/[id]",
      params: { id: "new", recurring: "true" },
    });
  });

  it("opens the complete Rules list", async () => {
    await render(<UpcomingRecurringSection />);

    fireEvent.press(screen.getByRole("button", { name: "View all recurring rules" }));
    expect(mockPush).toHaveBeenCalledWith("/recurring");
  });

  it("shows upcoming Rules and opens their editor", async () => {
    const salary = createRecurringRule({
      id: "salary",
      name: "Salary",
      type: "income",
      amountMinor: 3000_00,
    });
    mockUseUpcomingRecurringRules.mockReturnValue({
      data: [
        { rule: salary, scheduledDate: "2026-03-29" },
        { rule: createRecurringRule({ id: "rent", name: "Rent" }), scheduledDate: "2026-04-05" },
      ],
      isError: false,
      isLoading: false,
    });

    await render(<UpcomingRecurringSection />);

    fireEvent.press(
      screen.getByRole("button", {
        name: `Salary, Tomorrow, plus ${formatCents(3000_00, "USD")}`,
      }),
    );
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/transaction/[id]",
      params: { id: "salary", recurring: "true" },
    });
  });
});

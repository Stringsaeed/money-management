import { fireEvent, render, screen } from "@testing-library/react-native";

import { UpcomingRecurringSection } from "@/components/home/upcoming-recurring-section";
import { createTransactionWithDetails } from "@/tests/test-utils/factories";
import { formatCents } from "@/utils/currency";

const mockPush = jest.fn();
const mockUseTransactions = jest.fn();

jest.mock("expo-router", () => ({
  router: { push: (href: string) => mockPush(href) },
}));

jest.mock("@/hooks/use-transactions", () => ({
  useTransactions: (filters: unknown) => mockUseTransactions(filters),
}));

jest.mock("@/utils/date", () => ({
  ...jest.requireActual("@/utils/date"),
  today: () => "2026-03-28",
}));

describe("UpcomingRecurringSection", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockUseTransactions.mockReturnValue({ data: [], isError: false, isLoading: false });
  });

  it("distinguishes a failed query from an empty schedule", async () => {
    mockUseTransactions.mockReturnValue({ data: [], isError: true, isLoading: false });

    await render(<UpcomingRecurringSection />);

    expect(screen.getByText("Upcoming payments unavailable")).toBeOnTheScreen();
    expect(screen.queryByText("Nothing scheduled yet")).not.toBeOnTheScreen();
  });

  it("shows a compact prompt when no recurring payments exist", async () => {
    await render(<UpcomingRecurringSection />);

    expect(mockUseTransactions).toHaveBeenCalledWith({
      isRecurring: true,
      startsOnOrAfter: "2026-03-28",
      sort: "asc",
      limit: 3,
    });
    expect(screen.queryByText("Subscriptions & recurring")).not.toBeOnTheScreen();
    expect(screen.getByText("Nothing scheduled yet")).toBeOnTheScreen();
    expect(screen.getByText(/Add subscriptions or recurring payments/)).toBeOnTheScreen();

    fireEvent.press(screen.getByRole("button", { name: "Add a recurring payment" }));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/transaction/[id]",
      params: { id: "new", recurring: "true" },
    });
  });

  it("opens the complete recurring payments list", async () => {
    await render(<UpcomingRecurringSection />);

    fireEvent.press(screen.getByRole("button", { name: "View all recurring payments" }));
    expect(mockPush).toHaveBeenCalledWith("/recurring");
  });

  it("shows the next active payments and opens their editor", async () => {
    mockUseTransactions.mockReturnValue({
      data: [
        createTransactionWithDetails({
          id: "rent",
          description: "Rent",
          date: "2026-04-05",
          isRecurring: true,
        }),
        createTransactionWithDetails({
          id: "salary",
          description: "Salary",
          type: "income",
          amount: 3000_00,
          date: "2026-03-29",
          isRecurring: true,
        }),
      ],
      isError: false,
      isLoading: false,
    });

    await render(<UpcomingRecurringSection />);

    expect(screen.getByText("Salary")).toBeOnTheScreen();
    expect(screen.getByText("Groceries · Tomorrow")).toBeOnTheScreen();
    expect(screen.getByText("Rent")).toBeOnTheScreen();

    fireEvent.press(
      screen.getByRole("button", {
        name: `Salary, Tomorrow, plus ${formatCents(3000_00, "USD")}`,
      }),
    );
    expect(mockPush).toHaveBeenCalledWith("/transaction/salary");
  });
});

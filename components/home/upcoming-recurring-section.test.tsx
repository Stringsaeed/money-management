import { fireEvent, render, screen } from "@testing-library/react-native";

import { UpcomingRecurringSection } from "@/components/home/upcoming-recurring-section";
import { createRecurringPayment } from "@/tests/test-utils/factories";
import { formatCents } from "@/utils/currency";

const mockPush = jest.fn();
const mockUseRecurringPayments = jest.fn();

jest.mock("expo-router", () => ({
  router: { push: (href: string) => mockPush(href) },
}));

jest.mock("@/hooks/use-recurring-payments", () => ({
  useRecurringPayments: () => mockUseRecurringPayments(),
}));

jest.mock("@/utils/date", () => ({
  ...jest.requireActual("@/utils/date"),
  today: () => "2026-03-28",
}));

describe("UpcomingRecurringSection", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockUseRecurringPayments.mockReturnValue({ data: [], isError: false, isLoading: false });
  });

  it("distinguishes a failed query from an empty schedule", async () => {
    mockUseRecurringPayments.mockReturnValue({ data: [], isError: true, isLoading: false });

    await render(<UpcomingRecurringSection />);

    expect(screen.getByText("Upcoming payments unavailable")).toBeOnTheScreen();
    expect(screen.queryByText("Nothing scheduled yet")).not.toBeOnTheScreen();
  });

  it("shows a compact prompt when no recurring payments exist", async () => {
    await render(<UpcomingRecurringSection />);

    expect(screen.queryByText("Subscriptions & recurring")).not.toBeOnTheScreen();
    expect(screen.getByText("Nothing scheduled yet")).toBeOnTheScreen();
    expect(screen.getByText(/Add subscriptions or recurring payments/)).toBeOnTheScreen();

    fireEvent.press(screen.getByRole("button", { name: "Add a recurring payment" }));
    expect(mockPush).toHaveBeenCalledWith("/recurring/new");
  });

  it("opens the complete recurring payments list", async () => {
    await render(<UpcomingRecurringSection />);

    fireEvent.press(screen.getByRole("button", { name: "View all recurring payments" }));
    expect(mockPush).toHaveBeenCalledWith("/recurring");
  });

  it("shows the next active payments and opens their editor", async () => {
    mockUseRecurringPayments.mockReturnValue({
      data: [
        createRecurringPayment({ id: "rent", name: "Rent", dayOfMonth: 5 }),
        createRecurringPayment({
          id: "salary",
          name: "Salary",
          type: "income",
          interval: "daily",
          amount: 3000_00,
        }),
      ],
      isError: false,
      isLoading: false,
    });

    await render(<UpcomingRecurringSection />);

    expect(screen.getByText("Salary")).toBeOnTheScreen();
    expect(screen.getByText("Daily · Tomorrow")).toBeOnTheScreen();
    expect(screen.getByText("Rent")).toBeOnTheScreen();

    fireEvent.press(
      screen.getByRole("button", {
        name: `Salary, Tomorrow, plus ${formatCents(3000_00, "USD")}`,
      }),
    );
    expect(mockPush).toHaveBeenCalledWith("/recurring/salary/edit");
  });
});

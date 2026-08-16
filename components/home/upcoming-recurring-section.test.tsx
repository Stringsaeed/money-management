import { fireEvent, render, screen } from "@testing-library/react-native";

import { UpcomingRecurringSection } from "@/components/home/upcoming-recurring-section";
import { createRecurringPayment } from "@/tests/test-utils/factories";

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
    mockUseRecurringPayments.mockReturnValue({ data: [], isLoading: false });
  });

  it("shows a compact prompt when no recurring payments exist", async () => {
    await render(<UpcomingRecurringSection />);

    expect(screen.getByText("Nothing scheduled yet")).toBeOnTheScreen();
    expect(screen.getByText(/Add subscriptions or recurring payments/)).toBeOnTheScreen();

    fireEvent.press(screen.getByRole("button", { name: "Add a recurring payment" }));
    expect(mockPush).toHaveBeenCalledWith("/recurring/new");
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
      isLoading: false,
    });

    await render(<UpcomingRecurringSection />);

    expect(screen.getByText("Salary")).toBeOnTheScreen();
    expect(screen.getByText("Daily · Tomorrow")).toBeOnTheScreen();
    expect(screen.getByText("Rent")).toBeOnTheScreen();

    fireEvent.press(screen.getByRole("button", { name: "Salary, Tomorrow" }));
    expect(mockPush).toHaveBeenCalledWith("/recurring/salary/edit");
  });
});

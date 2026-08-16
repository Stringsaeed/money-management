import { act, fireEvent, render, screen } from "@testing-library/react-native";

import { RecurringSettlementBanner } from "@/components/recurring/recurring-settlement-banner";

const mockDismiss = jest.fn();
const mockPush = jest.fn();
const mockRetry = jest.fn().mockResolvedValue(undefined);
const mockUseFeedback = jest.fn();

jest.mock("expo-router", () => ({
  router: { push: (href: unknown) => mockPush(href) },
}));

jest.mock("@/components/recurring/recurring-settlement-provider", () => ({
  useRecurringSettlementFeedback: () => mockUseFeedback(),
}));

describe("RecurringSettlementBanner", () => {
  beforeEach(() => {
    mockDismiss.mockClear();
    mockPush.mockClear();
    mockRetry.mockClear();
  });

  it("keeps unresolved Rules visible and links to the attention filter", async () => {
    mockUseFeedback.mockReturnValue({
      dismiss: mockDismiss,
      error: new Error("settlement failed"),
      report: {
        generatedCount: 0,
        rules: [{ kind: "needs_attention" }],
      },
      retry: mockRetry,
    });

    await render(<RecurringSettlementBanner />);

    expect(screen.queryByLabelText("Dismiss recurring update")).not.toBeOnTheScreen();
    expect(screen.getByText("Recurring Rules need attention")).toBeOnTheScreen();
    await act(async () => {
      fireEvent.press(screen.getByText("Try again"));
      await mockRetry.mock.results.at(-1)?.value;
    });
    fireEvent.press(screen.getByText("Review Rules →"));

    expect(mockRetry).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/recurring",
      params: { filter: "needs_attention" },
    });
  });

  it("shows and automatically dismisses a successful Settlement summary", async () => {
    jest.useFakeTimers();
    mockUseFeedback.mockReturnValue({
      dismiss: mockDismiss,
      error: null,
      report: {
        generatedCount: 2,
        rules: [],
      },
      retry: mockRetry,
    });

    await render(<RecurringSettlementBanner />);

    expect(screen.getByText("2 scheduled transactions were added.")).toBeOnTheScreen();
    act(() => jest.advanceTimersByTime(5000));
    expect(mockDismiss).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });
});

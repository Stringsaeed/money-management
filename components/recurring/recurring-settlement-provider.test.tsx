import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, waitFor } from "@testing-library/react-native";
import { AppState, Text } from "react-native";

import {
  RecurringSettlementProvider,
  useRecurringSettlementFeedback,
} from "./recurring-settlement-provider";

const mockSettle = jest.fn();
const mockRecurringRules = { settle: mockSettle };

jest.mock("@/modules/recurring-rules/provider", () => ({
  useRecurringRulesModule: () => mockRecurringRules,
}));

function FeedbackProbe() {
  const feedback = useRecurringSettlementFeedback();
  return <Text>{feedback.report?.generatedCount ?? "none"}</Text>;
}

describe("RecurringSettlementProvider", () => {
  it("settles on launch and again when the app returns to the foreground", async () => {
    mockSettle.mockResolvedValue({
      localDate: "2026-04-15",
      startedAt: "2026-04-15T08:00:00.000Z",
      finishedAt: "2026-04-15T08:00:00.000Z",
      generatedCount: 1,
      totalMinor: 120_000,
      rules: [],
      effects: ["ledger"],
    });
    let appStateListener: ((state: "active" | "background" | "inactive") => void) | undefined;
    jest.spyOn(AppState, "addEventListener").mockImplementation((_, listener) => {
      appStateListener = listener;
      return { remove: jest.fn() };
    });
    const queryClient = new QueryClient();
    const invalidateQueries = jest.spyOn(queryClient, "invalidateQueries");
    const screen = await render(
      <QueryClientProvider client={queryClient}>
        <RecurringSettlementProvider>
          <FeedbackProbe />
        </RecurringSettlementProvider>
      </QueryClientProvider>,
    );

    await waitFor(() => expect(mockSettle).toHaveBeenCalledTimes(1));
    expect(screen.getByText("1")).toBeOnTheScreen();
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["transactions"] });

    await act(async () => {
      appStateListener?.("background");
      appStateListener?.("active");
    });
    await waitFor(() => expect(mockSettle).toHaveBeenCalledTimes(2));
  });
});

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, waitFor } from "@testing-library/react-native";
import { AppState, Text } from "react-native";

import * as ledgerCache from "@/modules/ledger-cache";
import { RecurringSettlementError, type SettlementReport } from "@/modules/recurring-rules";
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
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

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
    const cohereRecurringEffects = jest
      .spyOn(ledgerCache, "cohereRecurringEffects")
      .mockResolvedValue(undefined);
    const screen = await render(
      <QueryClientProvider client={queryClient}>
        <RecurringSettlementProvider>
          <FeedbackProbe />
        </RecurringSettlementProvider>
      </QueryClientProvider>,
    );

    await waitFor(() => expect(mockSettle).toHaveBeenCalledTimes(1));
    expect(screen.getByText("1")).toBeOnTheScreen();
    expect(cohereRecurringEffects).toHaveBeenCalledWith(queryClient, ["ledger"]);

    await act(async () => {
      appStateListener?.("background");
      appStateListener?.("active");
    });
    await waitFor(() => expect(mockSettle).toHaveBeenCalledTimes(2));
  });

  it("coheres partially committed work from a failed foreground Settlement", async () => {
    const report: SettlementReport = {
      localDate: "2026-04-15",
      startedAt: "2026-04-15T08:00:00.000Z",
      finishedAt: "2026-04-15T08:00:00.000Z",
      generatedCount: 1,
      totalMinor: 120_000,
      rules: [],
      effects: ["rules", "ledger"],
    };
    mockSettle.mockRejectedValue(
      new RecurringSettlementError(report, [
        { ruleId: "rule-1", cause: new Error("Rule storage failed") },
      ]),
    );
    const cohereRecurringEffects = jest
      .spyOn(ledgerCache, "cohereRecurringEffects")
      .mockResolvedValue(undefined);
    const queryClient = new QueryClient();

    await render(
      <QueryClientProvider client={queryClient}>
        <RecurringSettlementProvider>
          <FeedbackProbe />
        </RecurringSettlementProvider>
      </QueryClientProvider>,
    );

    await waitFor(() =>
      expect(cohereRecurringEffects).toHaveBeenCalledWith(queryClient, report.effects),
    );
  });
});

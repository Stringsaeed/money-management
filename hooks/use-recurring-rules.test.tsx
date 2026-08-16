import { act, waitFor } from "@testing-library/react-native";

import {
  useCreateRecurringRule,
  usePauseRecurringRule,
  useRecurringRule,
  useRecurringRulesList,
} from "@/hooks/use-recurring-rules";
import type { RecurringRuleDraft, RecurringRules } from "@/modules/recurring-rules";
import { createRecurringRule } from "@/tests/test-utils/factories";
import { renderHookWithProviders } from "@/tests/test-utils/render";

const mockModule: jest.Mocked<RecurringRules> = {
  read: jest.fn(),
  change: jest.fn(),
  settle: jest.fn(),
};

jest.mock("@/modules/recurring-rules/provider", () => ({
  useRecurringRulesModule: () => mockModule,
}));

const draft: RecurringRuleDraft = {
  name: "Rent",
  type: "expense",
  amountMinor: 120_000,
  currency: "USD",
  accountId: "account-1",
  toAccountId: null,
  categoryId: null,
  description: "Monthly rent",
  frequency: "month",
  intervalCount: 1,
  startDate: "2026-04-01",
  endDate: null,
  endCount: null,
  timeZone: "Asia/Dubai",
};

describe("Recurring Rules hooks", () => {
  it("adapts the list read to caller-friendly query data", async () => {
    mockModule.read.mockResolvedValue({ kind: "list", rules: [] });

    const { result } = await renderHookWithProviders(() => useRecurringRulesList("archived"));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockModule.read).toHaveBeenCalledWith({ kind: "list", filter: "archived" });
    expect(result.current.data).toEqual([]);
  });

  it("translates successful semantic effects into cache invalidation", async () => {
    mockModule.change.mockResolvedValue({
      kind: "applied",
      ruleId: "rule-1",
      revision: 1,
      settlement: { generatedCount: 1, totalMinor: 120_000 },
      effects: ["rules", "upcoming", "ledger", "balances", "summaries"],
    });
    const { result, client } = await renderHookWithProviders(() => useCreateRecurringRule());
    const invalidateQueries = jest.spyOn(client, "invalidateQueries");

    await act(async () => {
      await result.current.mutateAsync({ rule: draft });
    });

    expect(mockModule.change).toHaveBeenCalledWith({ kind: "create", rule: draft });
    for (const queryKey of [
      ["recurring-rules"],
      ["recurring-rules", "upcoming"],
      ["transactions"],
      ["account-balances"],
      ["month-summary"],
      ["transaction-date-range"],
    ]) {
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey });
    }
  });

  it("refreshes the active rule detail immediately after an applied change", async () => {
    let storedRule = createRecurringRule({ id: "rule-1" });
    mockModule.read.mockImplementation(async (query) => {
      if (query.kind !== "detail") throw new Error("Expected a detail read.");
      return { kind: "detail", rule: storedRule };
    });
    mockModule.change.mockImplementation(async () => {
      storedRule = createRecurringRule({
        id: "rule-1",
        lifecycle: "paused",
        revision: 2,
      });
      return {
        kind: "applied",
        ruleId: "rule-1",
        revision: 2,
        settlement: { generatedCount: 0, totalMinor: 0 },
        effects: ["rules", "upcoming"],
      };
    });

    const { result, client } = await renderHookWithProviders(() => ({
      detail: useRecurringRule("rule-1"),
      pause: usePauseRecurringRule(),
    }));

    await waitFor(() => expect(result.current.detail.data?.lifecycle).toBe("active"));
    jest.spyOn(client, "invalidateQueries").mockResolvedValue(undefined);

    await act(async () => {
      await result.current.pause.mutateAsync({ ruleId: "rule-1", expectedRevision: 1 });
    });

    expect(result.current.detail.data).toMatchObject({ lifecycle: "paused", revision: 2 });
  });

  it("returns previews without invalidating settled data", async () => {
    mockModule.change.mockResolvedValue({
      kind: "preview_required",
      confirmationToken: "confirmation-1",
      preview: {
        count: 1,
        totalMinor: 120_000,
        currency: "USD",
        firstDate: "2026-04-01",
        lastDate: "2026-04-01",
      },
    });
    const { result, client } = await renderHookWithProviders(() => useCreateRecurringRule());
    const invalidateQueries = jest.spyOn(client, "invalidateQueries");

    await act(async () => {
      await result.current.mutateAsync({ rule: draft });
    });

    expect(invalidateQueries).not.toHaveBeenCalled();
  });
});

import { act, waitFor } from "@testing-library/react-native";

import { useCreateRecurringRule, useRecurringRulesList } from "@/hooks/use-recurring-rules";
import type { RecurringRuleDraft, RecurringRules } from "@/modules/recurring-rules";
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

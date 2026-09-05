import { act, waitFor } from "@testing-library/react-native";

import {
  useCreateRecurringRule,
  usePauseRecurringRule,
  useRecurringRule,
  useRecurringRulesList,
  useSettleRecurringRules,
} from "@/hooks/use-recurring-rules";
import * as ledgerCache from "@/modules/ledger-cache";
import {
  RecurringSettlementError,
  type RecurringRuleDraft,
  type RecurringRules,
  type SettlementReport,
} from "@/modules/recurring-rules";
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
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

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
    const cohereRecurringEffects = jest
      .spyOn(ledgerCache, "cohereRecurringEffects")
      .mockResolvedValue(undefined);

    await act(async () => {
      await result.current.mutateAsync({ rule: draft });
    });

    expect(mockModule.change).toHaveBeenCalledWith({ kind: "create", rule: draft });
    expect(cohereRecurringEffects).toHaveBeenCalledWith(client, [
      "rules",
      "upcoming",
      "ledger",
      "balances",
      "summaries",
    ]);
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
    const { result } = await renderHookWithProviders(() => useCreateRecurringRule());
    const cohereRecurringEffects = jest.spyOn(ledgerCache, "cohereRecurringEffects");

    await act(async () => {
      await result.current.mutateAsync({ rule: draft });
    });

    expect(cohereRecurringEffects).not.toHaveBeenCalled();
  });

  it("awaits coherence after an explicit successful Settlement", async () => {
    const report: SettlementReport = {
      localDate: "2026-04-15",
      startedAt: "2026-04-15T08:00:00.000Z",
      finishedAt: "2026-04-15T08:00:00.000Z",
      generatedCount: 1,
      totalMinor: 120_000,
      rules: [],
      effects: ["ledger", "balances"],
    };
    mockModule.settle.mockResolvedValue(report);
    let resolveCoherence!: () => void;
    const coherence = new Promise<void>((resolve) => {
      resolveCoherence = resolve;
    });
    let signalCoherenceStarted!: () => void;
    const coherenceStarted = new Promise<void>((resolve) => {
      signalCoherenceStarted = resolve;
    });
    const cohereRecurringEffects = jest
      .spyOn(ledgerCache, "cohereRecurringEffects")
      .mockImplementation(() => {
        signalCoherenceStarted();
        return coherence;
      });
    const { result, client } = await renderHookWithProviders(() => useSettleRecurringRules());

    await act(async () => {
      const settlement = result.current.mutateAsync();
      let settled = false;
      void settlement.then(() => {
        settled = true;
      });
      await coherenceStarted;
      expect(cohereRecurringEffects).toHaveBeenCalledWith(client, report.effects);
      expect(settled).toBe(false);
      resolveCoherence();
      await settlement;
    });
  });

  it("coheres effects from a partial Settlement before surfacing its typed error", async () => {
    const report: SettlementReport = {
      localDate: "2026-04-15",
      startedAt: "2026-04-15T08:00:00.000Z",
      finishedAt: "2026-04-15T08:00:00.000Z",
      generatedCount: 1,
      totalMinor: 120_000,
      rules: [],
      effects: ["rules", "ledger"],
    };
    const error = new RecurringSettlementError(report, [
      { ruleId: "rule-1", cause: new Error("Storage failed") },
    ]);
    mockModule.settle.mockRejectedValue(error);
    const cohereRecurringEffects = jest
      .spyOn(ledgerCache, "cohereRecurringEffects")
      .mockResolvedValue(undefined);
    const { result, client } = await renderHookWithProviders(() => useSettleRecurringRules());

    await act(async () => {
      await expect(result.current.mutateAsync()).rejects.toBe(error);
    });

    expect(cohereRecurringEffects).toHaveBeenCalledWith(client, report.effects);
  });

  it("refuses settle while the device is synced, including offline_cached", async () => {
    const { result } = await renderHookWithProviders(() => useSettleRecurringRules(), {
      ledgerSelection: {
        kind: "synced",
        householdId: "household-1",
        offlineState: { kind: "offline_cached", reason: "Sync is temporarily unavailable." },
      },
    });

    await act(async () => {
      await expect(result.current.mutateAsync()).rejects.toThrow(
        "unavailable for the synced ledger",
      );
    });
    expect(mockModule.settle).not.toHaveBeenCalled();
  });
});

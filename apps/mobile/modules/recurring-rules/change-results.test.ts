import {
  candidateFromDraft,
  candidateFromExisting,
  changeEffects,
  invalidLifecycle,
  staleResult,
} from "./change-results";
import { settlementEffects } from "./settlement";
import type { RecurringRuleDraft } from "./types";

const draft = (overrides: Partial<RecurringRuleDraft> = {}): RecurringRuleDraft => ({
  name: "Rent",
  type: "expense",
  amountMinor: 1200_00,
  currency: "USD",
  accountId: "account-1",
  toAccountId: null,
  categoryId: "category-1",
  description: "Monthly rent",
  frequency: "month",
  intervalCount: 1,
  startDate: "2026-01-05",
  endDate: null,
  endCount: null,
  timeZone: "Asia/Dubai",
  ...overrides,
});

describe("changeEffects", () => {
  it("returns rules+upcoming only when nothing was generated", () => {
    expect(changeEffects(0)).toEqual(["rules", "upcoming"]);
  });

  it("delegates to settlementEffects when generatedCount is positive", () => {
    expect(changeEffects(2)).toEqual(settlementEffects(2));
    expect(changeEffects(2)).toEqual(["rules", "upcoming", "ledger", "balances", "summaries"]);
  });
});

describe("candidateFromDraft", () => {
  it("activates a draft as revision 1 with eligibilityFloor from startDate", () => {
    const now = "2026-03-28T10:00:00.000Z";
    const rule = candidateFromDraft("rule-1", draft(), now);

    expect(rule).toMatchObject({
      id: "rule-1",
      name: "Rent",
      amountMinor: 1200_00,
      accountId: "account-1",
      lifecycle: "active",
      health: "ready",
      attentionReasons: [],
      attentionDetails: null,
      eligibilityFloor: "2026-01-05",
      revision: 1,
      createdAt: now,
      updatedAt: now,
    });
  });

  it("copies draft schedule fields and clears settlement/lifecycle timestamps", () => {
    const rule = candidateFromDraft(
      "rule-2",
      draft({
        endDate: "2026-12-31",
        endCount: 12,
        frequency: "week",
        intervalCount: 2,
      }),
      "2026-04-01T00:00:00.000Z",
    );

    expect(rule).toMatchObject({
      id: "rule-2",
      endDate: "2026-12-31",
      endCount: 12,
      frequency: "week",
      intervalCount: 2,
      lifecycleChangedAt: null,
      healthChangedAt: null,
      lastSettlementAttemptAt: null,
      lastSettlementError: null,
    });
  });
});

describe("staleResult", () => {
  it("returns missing_rule when the rule is absent", () => {
    expect(staleResult(null, 3, "rule-missing")).toEqual({
      kind: "missing_rule",
      ruleId: "rule-missing",
    });
  });

  it("returns null when revision matches and stale_revision when it does not", () => {
    const rule = candidateFromDraft("rule-3", draft(), "2026-05-01T00:00:00.000Z");

    expect(staleResult(rule, 1, "rule-3")).toBeNull();
    expect(staleResult({ ...rule, revision: 4 }, 2, "rule-3")).toEqual({
      kind: "stale_revision",
      ruleId: "rule-3",
      expectedRevision: 2,
      actualRevision: 4,
    });
  });
});

describe("invalidLifecycle", () => {
  it("returns invalid_intent when pause requires an active Rule", () => {
    expect(invalidLifecycle("pause", "active")).toEqual({
      kind: "invalid_intent",
      issues: [{ field: "rule", message: "pause requires a active Rule." }],
    });
  });

  it("returns invalid_intent when restore requires an archived Rule", () => {
    expect(invalidLifecycle("restore", "archived")).toEqual({
      kind: "invalid_intent",
      issues: [{ field: "rule", message: "restore requires a archived Rule." }],
    });
  });
});

describe("candidateFromExisting", () => {
  it("overlays draft fields onto the existing rule while keeping identity", () => {
    const existing = candidateFromDraft("rule-4", draft(), "2026-06-01T00:00:00.000Z");
    const next = candidateFromExisting(
      existing,
      draft({
        name: "Rent (updated)",
        amountMinor: 1300_00,
        endDate: "2026-12-31",
      }),
      {},
    );

    expect(next).toMatchObject({
      id: "rule-4",
      revision: 1,
      name: "Rent (updated)",
      amountMinor: 1300_00,
      endDate: "2026-12-31",
      accountId: "account-1",
      lifecycle: "active",
    });
  });

  it("lets overrides win over both existing and draft fields", () => {
    const existing = candidateFromDraft("rule-5", draft(), "2026-06-02T00:00:00.000Z");
    const next = candidateFromExisting(
      existing,
      draft({ name: "From draft", amountMinor: 1400_00 }),
      { revision: 7, lifecycle: "paused", name: "From overrides" },
    );

    expect(next).toMatchObject({
      id: "rule-5",
      name: "From overrides",
      amountMinor: 1400_00,
      revision: 7,
      lifecycle: "paused",
    });
  });
});

import { describe, expect, it } from "@jest/globals";

import type { RecurringChangeResult } from "@/modules/recurring-rules";

import { recurringChangeFailureMessage } from "./recurring-change-feedback";

describe("recurringChangeFailureMessage", () => {
  it("joins invalid_intent issues and returns fixed copy for stale/needs_attention", () => {
    const invalid: RecurringChangeResult = {
      kind: "invalid_intent",
      issues: [
        { field: "amountMinor", message: "Amount is required." },
        { field: "accountId", message: "Pick an account." },
      ],
    };
    expect(recurringChangeFailureMessage(invalid)).toBe("Amount is required. Pick an account.");

    expect(
      recurringChangeFailureMessage({
        kind: "stale_revision",
        ruleId: "rule_1",
        expectedRevision: 1,
        actualRevision: 2,
      }),
    ).toBe("This Recurring Rule changed elsewhere. Reopen it and try again.");

    expect(
      recurringChangeFailureMessage({
        kind: "needs_attention",
        ruleId: "rule_1",
        reasons: [],
      }),
    ).toBe("Repair this Recurring Rule before continuing.");
  });

  it("returns the unavailable fallback for missing and non-failure kinds", () => {
    expect(
      recurringChangeFailureMessage({ kind: "missing_rule", ruleId: "rule_missing" }),
    ).toBe("The Recurring Rule is no longer available.");

    expect(
      recurringChangeFailureMessage({
        kind: "applied",
        ruleId: "rule_1",
        revision: 3,
        settlement: { generatedCount: 0, totalMinor: 0 },
        effects: [],
      }),
    ).toBe("The Recurring Rule is no longer available.");
  });
});

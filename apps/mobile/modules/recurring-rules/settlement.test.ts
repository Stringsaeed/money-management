import { describe, expect, it } from "@jest/globals";

import { candidateFromDraft } from "./change-results";
import { previewUnpersistedRule } from "./settlement";
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

describe("previewUnpersistedRule", () => {
  it("returns count, total, and date bounds for pending schedule dates", () => {
    const rule = candidateFromDraft("rule-1", draft(), "2026-01-01T00:00:00.000Z");
    const preview = previewUnpersistedRule(rule, "2026-03-05");

    expect(preview).toEqual({
      count: 3,
      totalMinor: 3600_00,
      currency: "USD",
      firstDate: "2026-01-05",
      lastDate: "2026-03-05",
    });
  });

  it("returns null when amountMinor is missing or no dates are pending", () => {
    const rule = candidateFromDraft("rule-2", draft(), "2026-01-01T00:00:00.000Z");

    expect(previewUnpersistedRule({ ...rule, amountMinor: null }, "2026-03-05")).toBeNull();
    expect(previewUnpersistedRule(rule, "2026-01-04")).toBeNull();
  });
});

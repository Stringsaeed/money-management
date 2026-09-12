import { describe, expect, it } from "vitest";

import {
  lifecycleAfterSettlement,
  pendingDatesFrom,
  type SettleableRule,
} from "@trove/domain/settlement";

const baseRule = (overrides: Partial<SettleableRule> = {}): SettleableRule => ({
  id: "rule_1",
  name: "Rent",
  type: "expense",
  amountMinor: 100_000,
  currency: "USD",
  accountId: "acc_1",
  toAccountId: null,
  categoryId: "cat_1",
  description: "Monthly rent",
  frequency: "day",
  intervalCount: 1,
  startDate: "2026-09-01",
  endDate: null,
  endCount: null,
  lifecycle: "active",
  health: "ready",
  eligibilityFloor: "2026-09-01",
  revision: 1,
  timeZone: "UTC",
  ...overrides,
});

describe("pendingDatesFrom", () => {
  it("returns unsettled dates on or after the eligibility floor through localDate", () => {
    expect(pendingDatesFrom(baseRule(), "2026-09-03", [])).toEqual([
      "2026-09-01",
      "2026-09-02",
      "2026-09-03",
    ]);
  });

  it("skips dates already settled and respects endCount remaining slots", () => {
    expect(pendingDatesFrom(baseRule(), "2026-09-05", ["2026-09-01", "2026-09-03"])).toEqual([
      "2026-09-02",
      "2026-09-04",
      "2026-09-05",
    ]);
    expect(
      pendingDatesFrom(baseRule({ endCount: 2 }), "2026-09-05", ["2026-09-01"]),
    ).toEqual(["2026-09-02"]);
  });
});

describe("lifecycleAfterSettlement", () => {
  it("marks the rule completed when settledCountAfter reaches endCount", () => {
    expect(
      lifecycleAfterSettlement(baseRule({ endCount: 3 }), "2026-09-03", 3),
    ).toBe("completed");
  });

  it("marks completed when endDate leaves no future occurrence, else keeps lifecycle", () => {
    expect(
      lifecycleAfterSettlement(
        baseRule({ endDate: "2026-09-03", frequency: "day" }),
        "2026-09-03",
        1,
      ),
    ).toBe("completed");
    expect(lifecycleAfterSettlement(baseRule({ lifecycle: "active" }), "2026-09-03", 1)).toBe(
      "active",
    );
    expect(lifecycleAfterSettlement(baseRule({ lifecycle: "paused" }), "2026-09-03", 1)).toBe(
      "paused",
    );
  });
});

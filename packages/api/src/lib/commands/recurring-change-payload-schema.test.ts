import { describe, expect, it } from "vitest";

import { recurringChangePayloadSchema } from "./handlers/recurring-change";

const validRule = {
  name: "Rent",
  type: "expense" as const,
  amountMinor: 120_000,
  currency: "USD",
  accountId: "acc_from",
  toAccountId: null,
  categoryId: "cat_housing",
  description: "Monthly rent",
  frequency: "month" as const,
  intervalCount: 1,
  startDate: "2026-01-01",
  endDate: null,
  endCount: null,
  timeZone: "America/New_York",
};

describe("recurringChangePayloadSchema", () => {
  it("accepts a create action with ruleId and a valid non-transfer rule", () => {
    const parsed = recurringChangePayloadSchema.parse({
      action: "create",
      ruleId: "rec_1",
      rule: validRule,
    });

    expect(parsed).toEqual({
      action: "create",
      ruleId: "rec_1",
      rule: validRule,
    });
  });

  it("rejects a create transfer rule without a destination Account", () => {
    expect(() =>
      recurringChangePayloadSchema.parse({
        action: "create",
        ruleId: "rec_1",
        rule: {
          ...validRule,
          type: "transfer",
          toAccountId: null,
        },
      }),
    ).toThrow(/Choose a destination Account/);
  });

  it("accepts pause|resume|archive|restore payloads with ruleId and expectedRevision", () => {
    for (const action of ["pause", "resume", "archive", "restore"] as const) {
      expect(
        recurringChangePayloadSchema.parse({
          action,
          ruleId: "rec_1",
          expectedRevision: 3,
        }),
      ).toEqual({
        action,
        ruleId: "rec_1",
        expectedRevision: 3,
      });
    }
  });

  it("accepts change_time_zone with ruleId, expectedRevision, and timeZone", () => {
    expect(
      recurringChangePayloadSchema.parse({
        action: "change_time_zone",
        ruleId: "rec_1",
        expectedRevision: 2,
        timeZone: "UTC",
      }),
    ).toEqual({
      action: "change_time_zone",
      ruleId: "rec_1",
      expectedRevision: 2,
      timeZone: "UTC",
    });
  });
});

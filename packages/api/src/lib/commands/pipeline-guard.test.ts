import { describe, expect, it } from "vitest";

import type { CommandPlan, PlanRejection } from "./pipeline";
import { isPlanRejection } from "./pipeline";

describe("isPlanRejection", () => {
  it("is false for plans that carry statements", () => {
    const plan: CommandPlan = {
      effects: ["ledger"],
      applied: { ok: true },
      statements: [],
      guards: [],
    };
    expect(isPlanRejection(plan)).toBe(false);
  });

  it("is true for typed plan rejections without statements", () => {
    const rejections: readonly PlanRejection[] = [
      { kind: "forbidden", role: "viewer", requiredCapability: "transaction.create" },
      { kind: "invalid_intent", issues: [{ field: "amount", message: "required" }] },
      { kind: "missing_entity", entityType: "account", entityId: "acc_1" },
      { kind: "stale_version", entityId: "acc_1", expectedVersion: 1, actualVersion: 2 },
      { kind: "conflict", reason: "unassigned_money_changed" },
    ];

    for (const rejection of rejections) {
      expect(isPlanRejection(rejection)).toBe(true);
    }
  });
});

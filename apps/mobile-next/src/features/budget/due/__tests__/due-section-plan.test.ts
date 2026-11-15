import type { V2DueOccurrence } from "@trove/api/v2/contracts";

import { dueGrouping, groupDue } from "../due-model";
import { dueSectionPlan } from "../due-section-plan";

const bill = (ruleId: string, scheduledDate: string): V2DueOccurrence => ({
  ruleId,
  name: ruleId,
  scheduledDate,
  amountMinor: 100_00,
  currency: "AED",
  accountId: "acc",
  categoryId: null,
  kind: "expense",
  overdue: false,
});

const grouping = dueGrouping("2026-10-11", "2026-10-25");

describe("dueSectionPlan", () => {
  it("draws today's bills as cards and later ones as rows, skipping empty sections", () => {
    const plan = dueSectionPlan(
      groupDue([bill("now", "2026-10-11"), bill("soon", "2026-10-14")], grouping),
      false,
    );
    expect(plan.map((section) => [section.kind, section.key])).toEqual([
      ["now", "today"],
      ["list", "week"],
    ]);
  });

  it("keeps Next payday for the salary even with no bills in it", () => {
    const plan = dueSectionPlan(groupDue([], grouping), true);
    expect(plan).toEqual([
      { kind: "list", key: "payday", title: "Next payday", items: [], salary: true },
    ]);
  });
});

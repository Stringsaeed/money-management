import type { V2DueOccurrence } from "@trove/api/v2/contracts";

import {
  budgetToday,
  dueGrouping,
  dueNow,
  dueThrough,
  groupDue,
  nextPaydayDate,
} from "../due-model";

const bill = (
  ruleId: string,
  scheduledDate: string,
  overrides: Partial<V2DueOccurrence> = {},
): V2DueOccurrence => ({
  ruleId,
  name: ruleId,
  scheduledDate,
  amountMinor: 100_00,
  currency: "AED",
  accountId: "acc",
  categoryId: null,
  kind: "expense",
  overdue: false,
  ...overrides,
});

describe("groupDue", () => {
  const grouping = dueGrouping("2026-10-11", "2026-10-25");

  it("sorts bills into Overdue, Today, This week and Next payday", () => {
    const sections = groupDue(
      [
        bill("late", "2026-10-02", { overdue: true }),
        bill("now", "2026-10-11"),
        bill("friday", "2026-10-16"),
        bill("edge", "2026-10-17"),
        bill("later", "2026-10-18"),
        bill("payday", "2026-10-25"),
        bill("beyond", "2026-10-26"),
      ],
      grouping,
    );
    expect(sections.map((section) => [section.key, section.items.map((i) => i.ruleId)])).toEqual([
      ["overdue", ["late"]],
      ["today", ["now"]],
      ["week", ["friday", "edge"]],
      ["payday", ["later", "payday"]],
    ]);
  });

  it("keeps an item before today overdue even when the server flag is false", () => {
    const [overdue] = groupDue([bill("slipped", "2026-10-10")], grouping);
    expect(overdue?.items.map((item) => item.ruleId)).toEqual(["slipped"]);
  });
});

describe("dueNow", () => {
  it("counts today and overdue bills and totals them", () => {
    const items = [
      bill("a", "2026-10-09", { overdue: true, amountMinor: 185_000 }),
      bill("b", "2026-10-11", { amountMinor: 5_000 }),
      bill("c", "2026-10-12"),
    ];
    expect(dueNow(items, "2026-10-11")).toEqual({ count: 2, totalMinor: 190_000 });
  });
});

describe("budget dates", () => {
  const current = { period: { start: "2026-09-25", end: "2026-10-24" }, daysLeft: 14 };

  it("derives today and the next payday from the period", () => {
    expect(budgetToday(current)).toBe("2026-10-11");
    expect(nextPaydayDate(current)).toBe("2026-10-25");
  });

  it("reads at least two weeks ahead", () => {
    expect(dueThrough("2026-10-11", "2026-10-25")).toBe("2026-10-25");
    expect(dueThrough("2026-10-20", "2026-10-25")).toBe("2026-11-02");
  });
});

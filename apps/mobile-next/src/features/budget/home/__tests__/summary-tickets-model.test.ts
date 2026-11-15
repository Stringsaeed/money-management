import type { V2DueOccurrence } from "@trove/api/v2/contracts";

import { budgetView } from "@/features/home/__fixtures__/budget-view";

import { dueBellLabel, dueThisWeekCount } from "../due-bell-model";
import { envelopeLines } from "../home-model";
import { billsTicket, savingTicket } from "../summary-tickets-model";

const view = budgetView([
  {
    id: "Rent",
    group: "bills",
    categoryIds: ["c-rent"],
    plannedMinor: 500_000,
    leftMinor: 0,
    spentMinor: 500_000,
  },
  {
    id: "Car loan",
    group: "bills",
    categoryIds: ["c-car"],
    plannedMinor: 185_000,
    leftMinor: 185_000,
  },
  {
    id: "Rent cheque",
    group: "saving",
    categoryIds: [],
    plannedMinor: 300_000,
    leftMinor: 569_500,
  },
]);
const lines = envelopeLines(view);

const bill = (name: string, scheduledDate: string, categoryId: string): V2DueOccurrence => ({
  ruleId: name,
  name,
  scheduledDate,
  amountMinor: 185_000,
  currency: "AED",
  accountId: "a1",
  categoryId,
  kind: "expense",
  overdue: false,
});

const input = {
  lines,
  envelopes: view.envelopes,
  dueItems: [bill("Car loan", "2026-10-11", "c-car")],
  currency: "AED",
  today: "2026-10-11",
  periodEnd: "2026-10-24",
};

describe("billsTicket", () => {
  it("counts paid bills and names the next one due", () => {
    expect(billsTicket(input)).toEqual({ value: "1 of 2 paid", sub: "next · Car loan today" });
  });

  it("names a bill that is short first", () => {
    const short = {
      ...input,
      dueItems: [{ ...bill("Car loan", "2026-10-18", "c-car"), amountMinor: 192_500 }],
    };
    expect(billsTicket(short).sub).toBe("Car loan short AED 75");
  });

  it("says when there are no bills", () => {
    expect(billsTicket({ ...input, lines: [] })).toEqual({
      value: "None yet",
      sub: "No bills planned",
    });
  });
});

describe("savingTicket", () => {
  it("totals what is set aside and names the soonest big payment", () => {
    expect(savingTicket(lines, "AED")).toMatchObject({
      value: "5,695 set aside",
      sub: "Rent cheque",
    });
    expect(savingTicket([], "AED")).toMatchObject({ value: "None yet", envelope: null });
  });
});

describe("due bell", () => {
  it("counts bills through this week, not the ones up to payday", () => {
    const sections = [
      { key: "overdue", title: "Overdue", items: [bill("A", "2026-10-01", "c")] },
      { key: "today", title: "Today", items: [bill("B", "2026-10-11", "c")] },
      { key: "week", title: "This week", items: [] },
      { key: "payday", title: "Next payday", items: [bill("C", "2026-10-22", "c")] },
    ] as const;
    expect(dueThisWeekCount(sections)).toBe(2);
    expect(dueBellLabel(2)).toBe("Due: 2 bills this week");
    expect(dueBellLabel(0)).toBe("Due: nothing this week");
  });
});

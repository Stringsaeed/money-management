import type { V2DueOccurrence, V2Envelope, V2EnvelopeTotals } from "@trove/api/v2/contracts";

import type { EnvelopeLine } from "../../home/home-model";
import {
  billRows,
  billsMonthSummary,
  billStatus,
  dueByEnvelope,
  firstDueByEnvelope,
  savingNeedingAttention,
  savingRow,
  savingRows,
  savingsSummary,
} from "../bills-model";

const totals = (
  plannedMinor: number,
  spentMinor: number,
  leftMinor: number,
): Pick<V2EnvelopeTotals, "plannedMinor" | "spentMinor" | "leftMinor"> => ({
  plannedMinor,
  spentMinor,
  leftMinor,
});

describe("billStatus", () => {
  it("is paid once the plan is fully spent", () => {
    expect(billStatus(totals(50_000, 50_000, 0))).toEqual({ kind: "paid" });
    expect(billStatus(totals(50_000, 60_000, 0))).toEqual({ kind: "paid" });
  });

  it("is ready while the plan is still unspent", () => {
    expect(billStatus(totals(50_000, 0, 50_000))).toEqual({ kind: "ready" });
    expect(billStatus(totals(50_000, 20_000, 80_000))).toEqual({ kind: "ready" });
  });

  it("is short by the overspend when Left goes below zero", () => {
    expect(billStatus(totals(50_000, 60_000, -10_000))).toEqual({
      kind: "short",
      shortMinor: 10_000,
    });
  });

  it("is short by the gap to the amount due when due data is given", () => {
    expect(billStatus(totals(50_000, 0, 30_000), 50_000)).toEqual({
      kind: "short",
      shortMinor: 20_000,
    });
    expect(billStatus(totals(50_000, 0, 50_000), 50_000)).toEqual({ kind: "ready" });
  });

  it("says unplanned when nothing is planned or spent", () => {
    expect(billStatus(totals(0, 0, 0))).toEqual({ kind: "unplanned" });
  });
});

describe("dueByEnvelope", () => {
  const bill = (
    ruleId: string,
    scheduledDate: string,
    patch: Partial<V2DueOccurrence> = {},
  ): V2DueOccurrence => ({
    ruleId,
    name: ruleId,
    scheduledDate,
    amountMinor: 45_000,
    currency: "AED",
    accountId: "bank",
    categoryId: "internet",
    kind: "expense",
    overdue: false,
    ...patch,
  });
  const envelopes = [
    { id: "du", group: "bills" as const, categoryIds: ["internet"] },
    { id: "dewa", group: "bills" as const, categoryIds: ["utilities"] },
    { id: "groceries", group: "everyday" as const, categoryIds: ["food"] },
  ];

  it("sums the bills each Bills envelope still has to pay through the period end", () => {
    const due = dueByEnvelope(
      [
        bill("du", "2026-10-18"),
        bill("du-late", "2026-09-18", { overdue: true, amountMinor: 40_000 }),
        bill("dewa", "2026-10-20", { categoryId: "utilities", amountMinor: 61_000 }),
        bill("du-next", "2026-10-25"),
      ],
      envelopes,
      "AED",
      "2026-10-24",
    );
    expect([...due.entries()]).toEqual([
      ["du", 85_000],
      ["dewa", 61_000],
    ]);
  });

  it("ignores income, other currencies, uncategorised bills and non-Bills envelopes", () => {
    const due = dueByEnvelope(
      [
        bill("refund", "2026-10-18", { kind: "income" }),
        bill("usd", "2026-10-18", { currency: "USD" }),
        bill("none", "2026-10-18", { categoryId: null }),
        bill("food", "2026-10-18", { categoryId: "food" }),
      ],
      envelopes,
      "AED",
      "2026-10-24",
    );
    expect(due.size).toBe(0);
  });

  it("finds the earliest bill each Bills envelope still owes", () => {
    const first = firstDueByEnvelope(
      [
        bill("du", "2026-10-18"),
        bill("du-late", "2026-09-18", { overdue: true }),
        bill("dewa", "2026-10-20", { categoryId: "utilities" }),
        bill("du-next", "2026-10-25"),
      ],
      envelopes,
      "AED",
      "2026-10-24",
    );
    expect([...first.entries()]).toEqual([
      ["du", "2026-09-18"],
      ["dewa", "2026-10-20"],
    ]);
  });

  it("makes a bill with Left below its next payment short, before anything is spent", () => {
    // du is due AED 450 on the 18th; the envelope has AED 300 Left (planned 300).
    const due = dueByEnvelope([bill("du", "2026-10-18")], envelopes, "AED", "2026-10-24");
    expect(billStatus(totals(30_000, 0, 30_000), due.get("du"))).toEqual({
      kind: "short",
      shortMinor: 15_000,
    });
  });
});

const line = (
  envelope: Partial<V2Envelope>,
  plannedMinor: number,
  leftMinor: number,
): EnvelopeLine => ({
  envelope: {
    id: envelope.id ?? "e1",
    name: "Rent",
    group: "saving",
    startFresh: false,
    targetMinor: null,
    dueDate: null,
    repeat: null,
    archived: false,
    sortOrder: 0,
    categoryIds: ["c1"],
    version: 1,
    ...envelope,
  },
  totals: {
    id: envelope.id ?? "e1",
    plannedMinor,
    budgetedMinor: plannedMinor,
    spentMinor: 0,
    rolloverMinor: 0,
    leftMinor,
  },
});

describe("savingRow", () => {
  it("measures progress to the target from Left", () => {
    const row = savingRow(line({ targetMinor: 400_000 }, 100_000, 100_000));
    expect(row.setAsideMinor).toBe(100_000);
    expect(row.fraction).toBe(0.25);
    expect(row.funded).toBe(false);
    expect(row.warnings).toEqual([]);
  });

  it("is funded with no warnings once the target is set aside", () => {
    const row = savingRow(line({ targetMinor: 400_000 }, 0, 400_000));
    expect(row.funded).toBe(true);
    expect(row.warnings).toEqual([]);
  });

  it("warns when the money is due before the next payday", () => {
    const row = savingRow(
      line({ targetMinor: 400_000, shortBeforePaydayMinor: 300_000 }, 100_000, 100_000),
    );
    expect(row.warnings).toEqual([{ kind: "short_before_payday", shortMinor: 300_000 }]);
  });

  it("warns when a target has no plan this period", () => {
    const row = savingRow(line({ targetMinor: 400_000 }, 0, 50_000));
    expect(row.warnings).toEqual([{ kind: "not_planned" }]);
  });

  it("does not warn about a plan for an envelope with no target", () => {
    expect(savingRow(line({}, 0, 0)).warnings).toEqual([]);
  });

  it("never shows negative money set aside", () => {
    expect(savingRow(line({ targetMinor: 400_000 }, 0, -500)).setAsideMinor).toBe(0);
  });
});

describe("savingRows", () => {
  it("lists the soonest due first and undated last, skipping other groups", () => {
    const rows = savingRows([
      line({ id: "late", dueDate: "2027-03-01" }, 0, 0),
      line({ id: "none" }, 0, 0),
      line({ id: "bill", group: "bills" }, 0, 0),
      line({ id: "soon", dueDate: "2026-12-01" }, 0, 0),
    ]);
    expect(rows.map((row) => row.line.envelope.id)).toEqual(["soon", "late", "none"]);
  });
});

const billLine = (id: string, plannedMinor: number, spentMinor: number, leftMinor: number) => {
  const base = line({ id, group: "bills" }, plannedMinor, leftMinor);
  return { ...base, totals: { ...base.totals, spentMinor } };
};

describe("billRows and billsMonthSummary", () => {
  const lines = [
    billLine("car", 185_000, 0, 185_000),
    billLine("du", 30_000, 0, 30_000),
    billLine("dewa", 45_000, 45_000, 0),
    billLine("gym", 0, 0, 0),
    line({ id: "rent" }, 0, 0),
  ];

  it("prices each bill by what is still to pay, or what was paid once paid", () => {
    const rows = billRows(lines, new Map([["du", 37_500]]), new Map([["du", "2026-10-18"]]));
    expect(
      rows.map((row) => [row.line.envelope.id, row.status.kind, row.amountMinor, row.dueDate]),
    ).toEqual([
      ["car", "ready", 185_000, null],
      ["du", "short", 37_500, "2026-10-18"],
      ["dewa", "paid", 45_000, null],
      ["gym", "unplanned", 0, null],
    ]);
  });

  it("adds up the month, what is paid and what is still to pay", () => {
    expect(billsMonthSummary(billRows(lines, new Map([["du", 37_500]])))).toEqual({
      count: 4,
      paidCount: 1,
      totalMinor: 267_500,
      paidMinor: 45_000,
      stillToPayMinor: 222_500,
    });
  });
});

describe("savingsSummary and savingNeedingAttention", () => {
  const rows = savingRows([
    line(
      { id: "rent", dueDate: "2026-12-01", targetMinor: 1_500_000, savingPerPaydayMinor: 250_000 },
      250_000,
      1_000_000,
    ),
    line({ id: "school", dueDate: "2027-01-04", targetMinor: 900_000 }, 0, 360_000),
    line({ id: "cushion", savingPerPaydayMinor: 139_500 }, 139_500, 420_000),
  ]);

  it("adds up what is set aside, what the targets still need, and each payday", () => {
    expect(savingsSummary(rows)).toEqual({
      setAsideMinor: 1_780_000,
      stillToSetAsideMinor: 1_040_000,
      perPaydayMinor: 389_500,
    });
  });

  it("picks the soonest big payment with a warning", () => {
    expect(savingNeedingAttention(rows)?.line.envelope.id).toBe("school");
    expect(savingNeedingAttention(rows.slice(0, 1))).toBeNull();
  });
});

import type { V2Envelope } from "@trove/api/v2/contracts";

import type { EnvelopeLine } from "../../home/home-model";
import {
  billMeta,
  billPill,
  codeAmount,
  dueStamp,
  plainFigure,
  savingAmount,
  savingAttention,
  savingMeta,
  savingPill,
  shortDate,
} from "../bills-copy";
import { savingRow, type BillRow } from "../bills-model";

const TODAY = "2026-10-12";

const line = (
  envelope: Partial<V2Envelope>,
  plannedMinor: number,
  leftMinor: number,
): EnvelopeLine => ({
  envelope: {
    id: "e1",
    name: "Rent cheque",
    group: "saving",
    startFresh: false,
    targetMinor: null,
    dueDate: null,
    repeat: null,
    archived: false,
    sortOrder: 0,
    categoryIds: [],
    version: 1,
    ...envelope,
  },
  totals: {
    id: "e1",
    plannedMinor,
    budgetedMinor: plannedMinor,
    spentMinor: 0,
    rolloverMinor: 0,
    leftMinor,
  },
});

const billRow = (
  status: BillRow["status"],
  leftMinor: number,
  dueDate: string | null,
): BillRow => ({
  line: line({ group: "bills", name: "du" }, 30_000, leftMinor),
  status,
  amountMinor: 37_500,
  dueDate,
});

describe("figures", () => {
  it("prints bill amounts with decimals and totals with the currency code", () => {
    expect(plainFigure(185_000, "AED")).toBe("1,850.00");
    expect(codeAmount(222_500, "AED")).toBe("AED 2,225");
    expect(codeAmount(-4_000, "AED")).toBe("−AED 40");
  });
});

describe("dates", () => {
  it("stamps due dates, with a year only when far ahead", () => {
    expect(dueStamp(TODAY, TODAY)).toBe("DUE TODAY");
    expect(dueStamp("2026-10-18", TODAY)).toBe("DUE 18 OCT");
    expect(dueStamp("2026-10-03", TODAY)).toBe("OVERDUE · 3 OCT");
    expect(shortDate("2027-01-04", TODAY)).toBe("4 JAN");
    expect(shortDate("2027-10-04", TODAY)).toBe("4 OCT 2027");
  });
});

describe("bill copy", () => {
  it("says when a short bill is due and what its envelope has", () => {
    const row = billRow({ kind: "short", shortMinor: 7_500 }, 30_000, "2026-10-18");
    expect(billMeta(row, TODAY, "AED")).toBe("DUE 18 OCT · ENVELOPE HAS 300");
    expect(billPill(row, "AED")).toEqual({
      status: "short",
      label: "Short 75",
      spoken: "Short by AED 75",
    });
  });

  it("labels ready, paid and unplanned bills", () => {
    expect(billMeta(billRow({ kind: "ready" }, 30_000, TODAY), TODAY, "AED")).toBe(
      "DUE TODAY · BILLS",
    );
    expect(billMeta(billRow({ kind: "ready" }, 30_000, null), TODAY, "AED")).toBe(
      "300 LEFT · BILLS",
    );
    expect(billPill(billRow({ kind: "paid" }, 0, null), "AED").label).toBe("Paid ✓");
    expect(billMeta(billRow({ kind: "paid" }, 0, null), TODAY, "AED")).toBe("PAID THIS MONTH");
    expect(billPill(billRow({ kind: "unplanned" }, 0, null), "AED").label).toBe("No plan");
  });
});

describe("saving copy", () => {
  const onTrack = savingRow(
    line(
      { dueDate: "2026-12-01", targetMinor: 1_500_000, savingPerPaydayMinor: 250_000 },
      250_000,
      1_000_000,
    ),
  );

  it("prints progress, due date and the per-payday amount", () => {
    expect(savingAmount(onTrack, "AED")).toBe("10,000 / 15,000");
    expect(savingMeta(onTrack, TODAY, "AED")).toBe("DUE 1 DEC · 2,500 EACH PAYDAY");
    expect(savingPill(onTrack, "AED")).toEqual({ status: "track", label: "On track" });
  });

  it("calls an undated goal growing and a met one set aside", () => {
    const cushion = savingRow(line({ savingPerPaydayMinor: 139_500 }, 139_500, 420_000));
    expect(savingMeta(cushion, TODAY, "AED")).toBe("NO DATE · 1,395 EACH PAYDAY");
    expect(savingPill(cushion, "AED").label).toBe("Growing");
    expect(savingAmount(cushion, "AED")).toBe("4,200");
    const met = savingRow(line({ dueDate: "2026-12-01", targetMinor: 100_000 }, 0, 100_000));
    expect(savingPill(met, "AED").label).toBe("Set aside ✓");
    expect(savingMeta(met, TODAY, "AED")).toBe("DUE 1 DEC · FULLY SET ASIDE");
  });

  it("puts warnings in the pill and the attention slot", () => {
    const unplanned = savingRow(
      line(
        { name: "Ramadan & Eid", dueDate: "2027-02-08", targetMinor: 600_000, paydaysLeft: 4 },
        0,
        0,
      ),
    );
    expect(savingPill(unplanned, "AED")).toEqual({ status: "short", label: "Not planned" });
    expect(savingAttention(unplanned, TODAY, "AED")).toEqual({
      title: "Ramadan & Eid isn't planned",
      sub: "Due 8 Feb · 4 paydays away",
    });
    const short = savingRow(
      line(
        { dueDate: "2026-10-20", targetMinor: 1_500_000, shortBeforePaydayMinor: 500_000 },
        0,
        1_000_000,
      ),
    );
    expect(savingPill(short, "AED").label).toBe("Short 5,000");
    expect(savingAttention(short, TODAY, "AED")).toEqual({
      title: "Rent cheque is due before payday",
      sub: "Short AED 5,000 · due 20 Oct",
    });
  });
});

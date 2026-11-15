import type { V2BudgetActivityItem } from "@trove/api/v2/contracts";

import { pickAttention, type AttentionInputs } from "../attention";

const base: AttentionInputs = {
  envelopes: [{ id: "groceries", name: "Groceries", leftMinor: 50_000 }],
  unassignedMinor: 0,
};

const move = (id: string): V2BudgetActivityItem => ({
  id,
  periodStart: "2026-09-25",
  fromEnvelopeId: null,
  fromName: null,
  toEnvelopeId: "groceries",
  toName: "Groceries",
  amountMinor: 12_000,
  reason: "plan",
  createdBy: "u1",
  createdByName: "Sara",
  createdAt: "2026-10-11T08:00:00.000Z",
});

describe("pickAttention", () => {
  it("is empty when nothing needs attention", () => {
    expect(pickAttention(base)).toEqual({ top: null, next: null, moreCount: 0 });
  });

  it("flags overspend with the worst envelope and the total", () => {
    const { top, moreCount } = pickAttention({
      ...base,
      envelopes: [
        { id: "g", name: "Groceries", leftMinor: -2_000 },
        { id: "f", name: "Fuel", leftMinor: -9_000 },
        { id: "d", name: "Dining", leftMinor: 100 },
      ],
    });
    expect(top).toEqual({ kind: "overspend", id: "f", name: "Fuel", count: 2, overMinor: 11_000 });
    expect(moreCount).toBe(0);
  });

  it("reads Not planned yet as short below zero and not planned above it", () => {
    expect(pickAttention({ ...base, unassignedMinor: 0 }).top).toBeNull();
    expect(pickAttention({ ...base, unassignedMinor: -40_000 }).top).toEqual({
      kind: "short",
      shortMinor: 40_000,
    });
    expect(pickAttention({ ...base, unassignedMinor: 500 }).top).toEqual({
      kind: "not_planned",
      amountMinor: 500,
    });
  });

  it("names the bill when exactly one is due today", () => {
    expect(
      pickAttention({ ...base, dueToday: { count: 1, totalMinor: 185_000, name: "Car loan" } }).top,
    ).toEqual({ kind: "due_today", count: 1, totalMinor: 185_000, name: "Car loan" });
    expect(pickAttention({ ...base, dueToday: { count: 0, totalMinor: 0, name: null } }).top).toBe(
      null,
    );
  });

  it("says the bills could not load instead of reading as nothing due", () => {
    expect(
      pickAttention({
        ...base,
        dueError: true,
        dueToday: { count: 0, totalMinor: 0, name: null },
      }).top,
    ).toEqual({ kind: "due_error" });
  });

  it("shows today's household activity last, with how many more moves came today", () => {
    expect(pickAttention({ ...base, activityToday: [move("a1"), move("a2")] }).top).toEqual({
      kind: "activity",
      item: move("a1"),
      moreToday: 1,
    });
    expect(
      pickAttention({ ...base, unassignedMinor: 500, activityToday: [move("a1")] }),
    ).toMatchObject({ top: { kind: "not_planned" }, next: { kind: "activity" }, moreCount: 1 });
  });

  it("orders payday, overspend, short, due today, not planned, and names the next one", () => {
    const everything: AttentionInputs = {
      envelopes: [{ id: "g", name: "Groceries", leftMinor: -100 }],
      unassignedMinor: 900,
      paydayPending: true,
      paydayToday: true,
      dueToday: { count: 2, totalMinor: 3_000, name: null },
    };
    expect(pickAttention(everything)).toEqual({
      top: { kind: "payday", late: false, today: true },
      next: { kind: "overspend", id: "g", name: "Groceries", count: 1, overMinor: 100 },
      moreCount: 3,
    });
    expect(pickAttention({ ...everything, paydayPending: false }).top?.kind).toBe("overspend");
    expect(
      pickAttention({ ...everything, paydayPending: false, unassignedMinor: -5 }).next?.kind,
    ).toBe("short");
    expect(
      pickAttention({ ...everything, paydayPending: false, envelopes: base.envelopes }),
    ).toMatchObject({ top: { kind: "due_today" }, next: { kind: "not_planned" }, moreCount: 1 });
  });
});

import { attentionText, pickAttention, type AttentionInputs } from "../attention";

const base: AttentionInputs = {
  envelopes: [{ name: "Groceries", leftMinor: 50_000 }],
  unassignedMinor: 0,
};

const money = (minor: number) => `AED ${minor / 100}`;

describe("pickAttention", () => {
  it("is empty when nothing needs attention", () => {
    expect(pickAttention(base)).toEqual({ top: null, moreCount: 0 });
  });

  it("flags overspend with the worst envelope and the total", () => {
    const { top, moreCount } = pickAttention({
      ...base,
      envelopes: [
        { name: "Groceries", leftMinor: -2_000 },
        { name: "Fuel", leftMinor: -9_000 },
        { name: "Dining", leftMinor: 100 },
      ],
    });
    expect(top).toEqual({ kind: "overspend", name: "Fuel", count: 2, overMinor: 11_000 });
    expect(moreCount).toBe(0);
  });

  it("flags not planned only when money is unassigned", () => {
    expect(pickAttention({ ...base, unassignedMinor: -500 }).top).toBeNull();
    expect(pickAttention({ ...base, unassignedMinor: 0 }).top).toBeNull();
    expect(pickAttention({ ...base, unassignedMinor: 500 }).top).toEqual({
      kind: "not_planned",
      amountMinor: 500,
    });
  });

  it("orders payday, overspend, due today, not planned and counts the rest", () => {
    const everything: AttentionInputs = {
      envelopes: [{ name: "Groceries", leftMinor: -100 }],
      unassignedMinor: 900,
      paydayPending: true,
      dueTodayCount: 2,
    };
    expect(pickAttention(everything)).toEqual({ top: { kind: "payday" }, moreCount: 3 });
    expect(pickAttention({ ...everything, paydayPending: false }).top?.kind).toBe("overspend");
    expect(
      pickAttention({ ...everything, paydayPending: false, envelopes: base.envelopes }),
    ).toEqual({ top: { kind: "due_today", count: 2 }, moreCount: 1 });
  });
});

describe("attentionText", () => {
  it("names the envelope when exactly one is over", () => {
    expect(
      attentionText({ kind: "overspend", name: "Groceries", count: 1, overMinor: 12_000 }, money),
    ).toBe("Groceries is AED 120 over");
  });

  it("summarises several envelopes and due bills", () => {
    expect(
      attentionText({ kind: "overspend", name: "Fuel", count: 3, overMinor: 30_000 }, money),
    ).toBe("3 envelopes are AED 300 over in total");
    expect(attentionText({ kind: "due_today", count: 1 }, money)).toBe("1 bill is due today");
    expect(attentionText({ kind: "not_planned", amountMinor: 45_000 }, money)).toBe(
      "AED 450 is not planned yet",
    );
  });
});

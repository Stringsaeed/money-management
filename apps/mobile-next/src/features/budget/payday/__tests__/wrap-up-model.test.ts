import { raiseSuggestion, wrapUpSummary, type WrapUpEnvelope } from "../wrap-up-model";

const line = (
  id: string,
  group: WrapUpEnvelope["group"],
  plannedMinor: number,
  spentMinor: number,
  leftMinor = plannedMinor - spentMinor,
): WrapUpEnvelope => ({ id, name: id, group, plannedMinor, spentMinor, leftMinor });

describe("wrapUpSummary", () => {
  const lines = [
    line("groceries", "everyday", 150_000, 162_000),
    line("fuel", "everyday", 40_000, 25_000),
    line("dewa", "bills", 50_000, 48_000),
    line("du", "bills", 30_000, 0),
    line("rent", "saving", 200_000, 0),
    line("trip", "saving", 10_000, 0),
  ];

  it("counts envelopes that ended on plan", () => {
    const summary = wrapUpSummary(lines);
    expect(summary.envelopeCount).toBe(6);
    expect(summary.onPlanCount).toBe(5);
  });

  it("sums Everyday spent against planned", () => {
    expect(wrapUpSummary(lines).everyday).toEqual({ spentMinor: 187_000, plannedMinor: 190_000 });
  });

  it("counts bills with a payment, and money saved for big payments", () => {
    const summary = wrapUpSummary(lines);
    expect(summary.bills).toEqual({ paid: 1, total: 2 });
    expect(summary.savedMinor).toBe(210_000);
  });

  it("lists uncovered overspend worst first", () => {
    const summary = wrapUpSummary([
      line("a", "everyday", 1_000, 1_500),
      line("b", "bills", 1_000, 5_000),
      line("c", "everyday", 1_000, 100),
    ]);
    expect(summary.overspent).toEqual([
      { id: "b", name: "b", overMinor: 4_000 },
      { id: "a", name: "a", overMinor: 500 },
    ]);
  });
});

describe("raiseSuggestion", () => {
  const history = (spent: [number, number, number], planned = 80_000) =>
    spent.map((value) => [line("dining", "everyday", planned, value)]);

  it("suggests the most spent, rounded up to AED 50", () => {
    expect(raiseSuggestion(history([82_000, 84_100, 81_000]), 100)).toEqual({
      envelopeId: "dining",
      name: "dining",
      suggestedMinor: 85_000,
    });
  });

  it("keeps an exact multiple of AED 50", () => {
    expect(raiseSuggestion(history([82_000, 85_000, 81_000]), 100)?.suggestedMinor).toBe(85_000);
  });

  it("needs the envelope over in every one of the three periods", () => {
    expect(raiseSuggestion(history([82_000, 79_000, 81_000]), 100)).toBeNull();
  });

  it("rounds up to 50 whole units of a 3-decimal currency", () => {
    // KWD 840.100 rounds up to KWD 850.000.
    expect(raiseSuggestion(history([820_000, 840_100, 810_000]), 1_000)?.suggestedMinor).toBe(
      850_000,
    );
  });

  it("needs three finished periods and ignores non-Everyday envelopes", () => {
    expect(raiseSuggestion(history([82_000, 84_000, 81_000]).slice(0, 2), 100)).toBeNull();
    const bills = [82_000, 84_000, 81_000].map((value) => [line("rent", "bills", 80_000, value)]);
    expect(raiseSuggestion(bills, 100)).toBeNull();
  });

  it("picks the envelope that needs the biggest raise", () => {
    const periods = [90_000, 91_000, 92_000].map((value) => [
      line("dining", "everyday", 80_000, value),
      line("fun", "everyday", 10_000, 12_000),
    ]);
    expect(raiseSuggestion(periods, 100)?.envelopeId).toBe("dining");
  });
});

import { projectBudget, type BudgetAssignment, type BudgetFacts } from "@trove/domain/budget";

import { coverAfterLine } from "../cover-copy";
import {
  allocateCover,
  coverInput,
  defaultCoverSelection,
  movePreview,
  pastCoverInput,
  rankCoverSources,
  rankPastCoverSources,
  type Place,
} from "../cover-move-model";

const place = (key: string, kind: Place["kind"], availableMinor: number): Place => ({
  key,
  id: key === "unplanned" ? null : key,
  name: key,
  kind,
  availableMinor,
});

const places = [
  place("unplanned", "unplanned", 10_000),
  place("groceries", "everyday", 5_000),
  place("dining", "everyday", 30_000),
  place("dewa", "bills", 8_000),
  place("rent", "saving", 90_000),
  place("empty", "everyday", 0),
  place("over", "everyday", -2_000),
  place("coffee", "everyday", 99_000),
];

describe("rankCoverSources", () => {
  it("ranks Not planned yet, Everyday by most Left, Bills surplus, then Saving for", () => {
    expect(rankCoverSources(places, "over").map((source) => source.key)).toEqual([
      "unplanned",
      "coffee",
      "dining",
      "groceries",
      "dewa",
      "rent",
    ]);
  });

  it("leaves out the envelope being covered and anything with nothing to give", () => {
    const keys = rankCoverSources(places, "dining").map((source) => source.key);
    expect(keys).not.toContain("dining");
    expect(keys).not.toContain("empty");
    expect(keys).not.toContain("over");
  });
});

describe("allocateCover", () => {
  const ranked = rankCoverSources(places, "over");

  it("takes from the selected sources in ranked order and previews what each is left with", () => {
    const plan = allocateCover(ranked, ["groceries", "unplanned"], 12_000);
    expect(plan.takes.map((take) => [take.place.key, take.takeMinor, take.afterMinor])).toEqual([
      ["unplanned", 10_000, 0],
      ["groceries", 2_000, 3_000],
    ]);
    expect(plan.coveredMinor).toBe(12_000);
    expect(plan.restMinor).toBe(0);
  });

  it("covers part and reports the rest when the sources run out", () => {
    const plan = allocateCover(ranked, ["unplanned", "groceries"], 20_000);
    expect(plan.coveredMinor).toBe(15_000);
    expect(plan.restMinor).toBe(5_000);
  });

  it("flags a take from Saving for", () => {
    expect(allocateCover(ranked, ["rent"], 1_000).takesFromSaving).toBe(true);
    expect(allocateCover(ranked, ["unplanned"], 1_000).takesFromSaving).toBe(false);
  });

  it("sends one cover assignment per source", () => {
    const plan = allocateCover(ranked, ["unplanned", "groceries"], 12_000);
    expect(coverInput("over", plan)).toEqual({
      items: [
        { fromEnvelopeId: null, toEnvelopeId: "over", amountMinor: 10_000, reason: "cover" },
        { fromEnvelopeId: "groceries", toEnvelopeId: "over", amountMinor: 2_000, reason: "cover" },
      ],
    });
  });
});

describe("defaultCoverSelection", () => {
  const ranked = rankCoverSources(places, "over");

  it("picks the fewest best sources that cover the amount", () => {
    expect(defaultCoverSelection(ranked, 10_000)).toEqual(["unplanned"]);
    expect(defaultCoverSelection(ranked, 40_000)).toEqual(["unplanned", "coffee"]);
  });

  it("never pre-picks Saving for, even when nothing else is enough", () => {
    expect(defaultCoverSelection(ranked, 500_000)).not.toContain("rent");
  });
});

describe("movePreview", () => {
  const from = place("groceries", "everyday", 5_000);
  const to = place("unplanned", "unplanned", 1_000);

  it("shows both sides after the move", () => {
    expect(movePreview(from, to, 2_000)).toEqual({
      status: "ok",
      capMinor: 5_000,
      fromAfterMinor: 3_000,
      toAfterMinor: 3_000,
    });
  });

  it("caps the amount at the source's Left", () => {
    expect(movePreview(from, to, 5_001)).toEqual({ status: "over_cap", capMinor: 5_000 });
    expect(movePreview(place("over", "everyday", -300), to, 100)).toEqual({
      status: "over_cap",
      capMinor: 0,
    });
  });

  it("needs an amount", () => {
    expect(movePreview(from, to, 0)).toEqual({ status: "no_amount", capMinor: 5_000 });
  });
});

describe("cover-past (C1)", () => {
  it("never takes from Not planned yet, and lets the overspent envelope repay itself", () => {
    expect(rankPastCoverSources(places).map((source) => source.key)).toEqual([
      "coffee",
      "dining",
      "groceries",
      "dewa",
      "rent",
    ]);
    const repaysItself = [
      place("unplanned", "unplanned", 50_000),
      place("groceries", "everyday", 8_000),
    ];
    expect(rankPastCoverSources(repaysItself).map((source) => source.key)).toEqual(["groceries"]);
  });

  it("pays each take back into Not planned yet from an envelope", () => {
    const ranked = rankPastCoverSources(places);
    const plan = allocateCover(ranked, ["groceries", "dewa"], 10_000);
    expect(pastCoverInput(plan)).toEqual({
      items: [
        { fromEnvelopeId: "groceries", toEnvelopeId: null, amountMinor: 5_000, reason: "cover" },
        { fromEnvelopeId: "dewa", toEnvelopeId: null, amountMinor: 5_000, reason: "cover" },
      ],
    });
  });

  it("previews the Not planned yet the engine computes after the pay-back", () => {
    // Groceries ended September AED 200 over; September and October each plan Groceries 2,000.
    const plan = (periodStart: string, to: string, amountMinor: number): BudgetAssignment => ({
      periodStart,
      fromEnvelopeId: null,
      toEnvelopeId: to,
      amountMinor,
      reason: "plan",
    });
    const facts: BudgetFacts = {
      paydays: [{ effectiveFrom: "2026-09-01", rule: { kind: "day", day: 1 } }],
      activationStart: "2026-09-01",
      envelopes: [
        { id: "groceries", group: "everyday", categoryIds: ["food"], startFresh: false },
        { id: "dining", group: "everyday", categoryIds: ["eat-out"], startFresh: false },
      ],
      assignments: [
        plan("2026-09-01", "groceries", 200_000),
        plan("2026-09-01", "dining", 100_000),
        plan("2026-10-01", "groceries", 200_000),
        plan("2026-10-01", "dining", 150_000),
      ],
      spending: [{ date: "2026-09-20", categoryId: "food", amountMinor: 220_000, onCard: false }],
      cardPayments: [],
      cashMinor: 780_000,
      openingCardDebtMinor: 0,
      today: "2026-10-05",
    };
    const before = projectBudget(facts).current;
    expect(before.unassignedMinor).toBe(330_000);
    expect(before.envelopes.map((totals) => [totals.envelopeId, totals.leftMinor])).toEqual([
      ["groceries", 200_000],
      ["dining", 250_000],
    ]);

    const ranked = rankPastCoverSources([
      place("unplanned", "unplanned", 330_000),
      place("groceries", "everyday", 200_000),
      place("dining", "everyday", 250_000),
    ]);
    const cover = allocateCover(ranked, defaultCoverSelection(ranked, 20_000), 20_000);
    const preview = coverAfterLine("past", cover, {
      name: "Groceries",
      leftMinor: 200_000,
      unassignedMinor: 330_000,
      money: (minor) => `AED ${minor / 100}`,
    });
    expect(preview).toBe("Not planned yet after: AED 3500");

    const written = pastCoverInput(cover).items.map((item) => ({
      ...item,
      periodStart: "2026-10-01",
    }));
    const after = projectBudget({ ...facts, assignments: [...facts.assignments, ...written] });
    expect(after.current.unassignedMinor).toBe(350_000);
    expect(after.current.envelopes.map((totals) => [totals.envelopeId, totals.leftMinor])).toEqual([
      ["groceries", 200_000],
      ["dining", 230_000],
    ]);
  });
});

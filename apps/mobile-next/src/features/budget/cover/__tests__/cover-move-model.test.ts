import {
  allocateCover,
  coverInput,
  defaultCoverSelection,
  movePreview,
  rankCoverSources,
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

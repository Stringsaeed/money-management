import {
  coverAfterLines,
  coverSourceGroups,
  coverSourceSub,
  coverStamp,
  safeToSpendAfter,
  safeToSpendDelta,
} from "../cover-display";
import { moveAfterLines, moveQuickPicks } from "../move-display";
import {
  allocateCover,
  envelopeMoveRequest,
  rankCoverSources,
  type Place,
} from "../cover-move-model";
import type { EnvelopeLine } from "../../home/home-model";

const place = (key: string, name: string, kind: Place["kind"], availableMinor: number): Place => ({
  key,
  id: key === "unplanned" ? null : key,
  name,
  kind,
  availableMinor,
});

// The Cover from… board: Dining & coffee is AED 175 over.
const unplanned = place("unplanned", "Not planned yet", "unplanned", 73_000);
const groceries = place("groceries", "Groceries", "everyday", 58_800);
const fun = place("fun", "Personal & fun", "everyday", 28_200);
const dewa = place("dewa", "DEWA", "bills", 4_000);
const cushion = place("cushion", "Emergency cushion", "saving", 420_000);
const dining = place("dining", "Dining & coffee", "everyday", -17_500);
const ranked = rankCoverSources([unplanned, groceries, fun, dewa, cushion, dining], "dining");

describe("safeToSpendDelta", () => {
  it("only moves when money crosses into or out of Everyday and Not planned yet", () => {
    expect(safeToSpendDelta("unplanned", "everyday", 17_500)).toBe(0);
    expect(safeToSpendDelta("everyday", "everyday", 17_500)).toBe(0);
    expect(safeToSpendDelta("bills", "everyday", 17_500)).toBe(17_500);
    expect(safeToSpendDelta("everyday", "saving", 17_500)).toBe(-17_500);
    expect(safeToSpendDelta("saving", "bills", 17_500)).toBe(0);
  });

  it("prints the figure and which way it went", () => {
    expect(safeToSpendAfter(166_500, 0, "AED")).toBe("1,665 · SAME");
    expect(safeToSpendAfter(166_500, 17_500, "AED")).toBe("1,840 · UP 175");
    expect(safeToSpendAfter(166_500, -17_500, "AED")).toBe("1,490 · DOWN 175");
  });
});

describe("coverSourceGroups", () => {
  it("groups the ranked sources as the board does", () => {
    expect(
      coverSourceGroups(ranked).map((group) => [group.label, group.places.map((p) => p.key)]),
    ).toEqual([
      ["BEST FIRST · KEEPS SAFE TO SPEND HONEST", ["unplanned"]],
      ["EVERYDAY", ["groceries", "fun"]],
      ["BILLS WITH SPARE · SAVINGS", ["dewa", "cushion"]],
    ]);
  });

  it("names the last group for what is in it, and leaves out empty groups", () => {
    expect(coverSourceGroups([dewa]).map((group) => group.label)).toEqual(["BILLS WITH SPARE"]);
    expect(coverSourceGroups([cushion]).map((group) => group.label)).toEqual(["SAVINGS"]);
  });
});

describe("coverSourceSub", () => {
  const plan = allocateCover(ranked, ["unplanned"], 17_500);

  it("shows what each source keeps, in the accent when it is part of the cover", () => {
    expect(coverSourceSub(unplanned, plan.takes[0], 17_500, "AED")).toEqual({
      text: "AFTER: 555",
      tone: "accent",
    });
    expect(coverSourceSub(groceries, undefined, 17_500, "AED")).toEqual({
      text: "AFTER: 413",
      tone: "tertiary",
    });
  });

  it("flags a partial source and warns before savings", () => {
    expect(coverSourceSub(dewa, undefined, 17_500, "AED").text).toBe("40 SPARE · PARTIAL");
    expect(coverSourceSub(cushion, undefined, 17_500, "AED")).toEqual({
      text: "SAVINGS · WE'LL ASK AGAIN",
      tone: "warning",
    });
  });
});

describe("coverStamp", () => {
  it("prints the envelope and what it is over by", () => {
    expect(coverStamp("over", "Dining & coffee", "🍽️", 17_500, "AED")).toEqual({
      text: "🍽️ DINING & COFFEE · OVER BY 175",
      tone: "negative",
    });
    expect(coverStamp("short", "DEWA", undefined, 12_000, "AED").text).toBe("DEWA · SHORT BY 120");
  });
});

describe("coverAfterLines", () => {
  it("prints the covered envelope, each source, and Safe to spend", () => {
    const plan = allocateCover(ranked, ["unplanned"], 17_500);
    expect(
      coverAfterLines(
        "over",
        plan,
        { name: "Dining & coffee", kind: "everyday", leftMinor: -17_500 },
        { unassignedMinor: 73_000, safeToSpendMinor: 166_500, currency: "AED" },
      ),
    ).toEqual([
      { label: "DINING & COFFEE", value: "0.00" },
      { label: "NOT PLANNED YET", value: "555.00" },
      { label: "SAFE TO SPEND", value: "1,665 · SAME", total: true },
    ]);
  });

  it("raises Safe to spend when a bill covers Everyday", () => {
    const plan = allocateCover(ranked, ["dewa"], 4_000);
    const lines = coverAfterLines(
      "over",
      plan,
      { name: "Dining & coffee", kind: "everyday", leftMinor: -17_500 },
      { unassignedMinor: 73_000, safeToSpendMinor: 166_500, currency: "AED" },
    );
    expect(lines.at(-1)?.value).toBe("1,705 · UP 40");
  });
});

describe("moveAfterLines", () => {
  it("prints both ends, ticking an envelope that is no longer over", () => {
    expect(
      moveAfterLines(fun, dining, 17_500, { safeToSpendMinor: 166_500, currency: "AED" }),
    ).toEqual([
      { label: "PERSONAL & FUN", value: "107.00" },
      { label: "DINING & COFFEE", value: "0.00 ✓" },
      { label: "SAFE TO SPEND", value: "1,665 · SAME", total: true },
    ]);
  });
});

describe("moveQuickPicks", () => {
  it("offers the cover, a round figure under it, and everything the source has", () => {
    expect(moveQuickPicks(dining, 28_200, "AED")).toEqual([
      { key: "cover", label: "Cover 175", amountMinor: 17_500 },
      { key: "round", label: "100", amountMinor: 10_000 },
      { key: "all", label: "All 282", amountMinor: 28_200 },
    ]);
  });

  it("skips a cover the source can't give, and offers nothing from an empty source", () => {
    expect(moveQuickPicks(dining, 10_000, "AED").map((pick) => pick.key)).toEqual(["round", "all"]);
    expect(moveQuickPicks(groceries, 0, "AED")).toEqual([]);
  });
});

describe("envelopeMoveRequest", () => {
  const line = (id: string, leftMinor: number): EnvelopeLine => ({
    envelope: {
      id,
      name: id,
      group: "everyday",
      startFresh: false,
      targetMinor: null,
      dueDate: null,
      repeat: null,
      archived: false,
      sortOrder: 0,
      categoryIds: [],
      version: 1,
    },
    totals: {
      id,
      plannedMinor: 0,
      budgetedMinor: 0,
      spentMinor: 0,
      rolloverMinor: 0,
      leftMinor,
    },
  });

  it("moves out of an envelope that has money", () => {
    expect(envelopeMoveRequest([line("groceries", 5_000)], 0, "groceries")).toEqual({
      kind: "move",
      fromId: "groceries",
    });
  });

  it("pulls into an overspent envelope from the best source", () => {
    const lines = [line("dining", -17_500), line("fun", 28_200)];
    expect(envelopeMoveRequest(lines, 0, "dining")).toEqual({
      kind: "move",
      fromId: "fun",
      toId: "dining",
    });
    expect(envelopeMoveRequest(lines, 73_000, "dining")).toEqual({
      kind: "move",
      fromId: null,
      toId: "dining",
    });
  });
});

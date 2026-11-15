import type { V2EnvelopeGroup } from "@trove/api/v2/contracts";

import {
  leftoverBreakdown,
  leftoverChoice,
  leftoverLines,
  leftoversInput,
  leftoverTotal,
  type LeftoverSource,
} from "../leftovers-model";

const line = (
  id: string,
  group: V2EnvelopeGroup,
  rolloverMinor: number,
  leftMinor: number,
): LeftoverSource => ({
  envelope: { id, name: id, group },
  totals: { rolloverMinor, leftMinor },
});

const lines = [
  line("groceries", "everyday", 30_000, 90_000),
  line("fuel", "everyday", 20_000, 5_000),
  line("dining", "everyday", 0, 40_000),
  line("rent", "saving", 500_000, 500_000),
  line("fun", "everyday", 10_000, -2_000),
];

describe("leftoverTotal", () => {
  it("adds only Everyday rollover", () => {
    expect(leftoverTotal(lines)).toBe(60_000);
  });

  it("is 0 when nothing rolled over", () => {
    expect(leftoverTotal([line("a", "everyday", 0, 100), line("b", "bills", 900, 900)])).toBe(0);
  });
});

describe("leftoverLines", () => {
  it("caps each envelope at what it still has Left", () => {
    expect(leftoverLines(lines)).toEqual([
      { envelopeId: "groceries", name: "groceries", amountMinor: 30_000 },
      { envelopeId: "fuel", name: "fuel", amountMinor: 5_000 },
    ]);
  });
});

describe("leftoversInput", () => {
  const movable = leftoverLines(lines);

  it("writes nothing when the money stays", () => {
    expect(leftoversInput(movable, { kind: "keep" })).toBeNull();
  });

  it("moves each envelope's leftover to the chosen Saving for in one batch", () => {
    expect(leftoversInput(movable, { kind: "saving", envelopeId: "cushion" })).toEqual({
      items: [
        {
          fromEnvelopeId: "groceries",
          toEnvelopeId: "cushion",
          amountMinor: 30_000,
          reason: "leftover",
        },
        { fromEnvelopeId: "fuel", toEnvelopeId: "cushion", amountMinor: 5_000, reason: "leftover" },
      ],
    });
  });

  it("sends the leftovers back to Not planned yet", () => {
    expect(
      leftoversInput(movable, { kind: "plan" })?.items.map((item) => item.toEnvelopeId),
    ).toEqual([null, null]);
  });

  it("writes nothing when no envelope has anything to give", () => {
    expect(leftoversInput([], { kind: "plan" })).toBeNull();
  });
});

describe("leftoverChoice", () => {
  it("keeps the money when Saving for is picked without an envelope", () => {
    expect(leftoverChoice("saving", null)).toEqual({ kind: "keep" });
    expect(leftoverChoice("saving", "cushion")).toEqual({ kind: "saving", envelopeId: "cushion" });
    expect(leftoverChoice("plan", "cushion")).toEqual({ kind: "plan" });
  });
});

describe("leftoverBreakdown", () => {
  it("lists each Everyday envelope's rollover, adding up to the total", () => {
    const shares = leftoverBreakdown(lines);
    expect(shares.map((share) => [share.envelopeId, share.rolloverMinor])).toEqual([
      ["groceries", 30_000],
      ["fuel", 20_000],
      ["fun", 10_000],
    ]);
    expect(shares.reduce((total, share) => total + share.rolloverMinor, 0)).toBe(
      leftoverTotal(lines),
    );
  });
});

import { budgetView } from "@/features/home/__fixtures__/budget-view";

import { envelopeRowModel, everydayLeftLabel } from "../envelope-row-model";
import { envelopeLines } from "../home-model";

const lines = envelopeLines(
  budgetView([
    {
      id: "Groceries",
      group: "everyday",
      categoryIds: [],
      plannedMinor: 160_000,
      leftMinor: 58_800,
      spentMinor: 101_200,
    },
    {
      id: "Dining",
      group: "everyday",
      categoryIds: [],
      plannedMinor: 60_000,
      leftMinor: -17_500,
      spentMinor: 77_500,
    },
    {
      id: "Fuel",
      group: "everyday",
      categoryIds: [],
      plannedMinor: 0,
      leftMinor: 4_000,
      rolloverMinor: 4_000,
    },
    { id: "Fun", group: "everyday", categoryIds: [], plannedMinor: 0, leftMinor: 0 },
  ]),
);
const [groceries, dining, fuel, fun] = lines;
const context = { currency: "AED", daysLeft: 14, pace: 0.55 };

describe("envelopeRowModel", () => {
  it("prints the daily amount, what is left and the plan", () => {
    expect(envelopeRowModel(groceries!, context)).toEqual({
      sub: "AED 42 a day",
      leftLabel: "588",
      ofLabel: "of 1,600",
      progress: 1 - 58_800 / 160_000,
      pace: 0.55,
      state: "ok",
      accessibilityLabel: "Groceries: 588 AED left of 1,600 AED",
    });
  });

  it("prints an overspent envelope in the negative", () => {
    expect(envelopeRowModel(dining!, context)).toMatchObject({
      sub: "Over by 175",
      leftLabel: "−175",
      ofLabel: "of 600",
      progress: 1,
      state: "over",
    });
  });

  it("marks money only carried from last month", () => {
    expect(envelopeRowModel(fuel!, context)).toMatchObject({
      sub: "From last month",
      leftLabel: "40",
      ofLabel: "rolled over",
      pace: null,
      state: "rolled",
    });
    expect(envelopeRowModel(fun!, context)).toMatchObject({ sub: "Not planned yet", ofLabel: "" });
  });

  it("prints dashes when the numbers are stale", () => {
    expect(envelopeRowModel(groceries!, { ...context, stale: true })).toMatchObject({
      sub: "—",
      leftLabel: "—",
      state: "unknown",
      pace: null,
    });
  });
});

describe("everydayLeftLabel", () => {
  it("sums what is left across Everyday", () => {
    expect(everydayLeftLabel(lines, "AED")).toBe("AED 453 LEFT");
    expect(everydayLeftLabel([dining!], "AED")).toBe("AED −175 LEFT");
  });
});

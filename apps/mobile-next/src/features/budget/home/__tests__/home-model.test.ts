import { envelopeProgress, perDayLine } from "../home-model";

const money = (minor: number) => `AED ${minor / 100}`;

describe("envelopeProgress", () => {
  it("is the share still left of planned plus rollover", () => {
    expect(
      envelopeProgress({ plannedMinor: 40_000, rolloverMinor: 10_000, leftMinor: 25_000 }),
    ).toEqual({
      fraction: 0.5,
      over: false,
    });
  });

  it("shows a negative Left as a full over bar", () => {
    expect(envelopeProgress({ plannedMinor: 40_000, rolloverMinor: 0, leftMinor: -100 })).toEqual({
      fraction: 1,
      over: true,
    });
  });

  it("is empty when nothing was planned", () => {
    expect(envelopeProgress({ plannedMinor: 0, rolloverMinor: 0, leftMinor: 0 })).toEqual({
      fraction: 0,
      over: false,
    });
  });
});

describe("perDayLine", () => {
  it("reads about X a day with days to payday", () => {
    expect(perDayLine({ safeToSpendMinor: 90_000, perDayMinor: 10_000, daysLeft: 9 }, money)).toBe(
      "about AED 100 a day · 9 days to payday",
    );
  });

  it("shows AED 0 a day when nothing is safe to spend", () => {
    expect(perDayLine({ safeToSpendMinor: -500, perDayMinor: 0, daysLeft: 1 }, money)).toBe(
      "AED 0 a day · 1 day to payday",
    );
  });
});

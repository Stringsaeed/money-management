import type { RunwayTick } from "@/ui/trove";

import { budgetStamp, stampDate } from "../budget-stamp";
import { floorWholeMinor, periodPace, runwayLabel } from "../runway";

describe("runwayLabel", () => {
  it("speaks the day, the days under and over, and the days to payday", () => {
    const ticks: RunwayTick[] = [
      ...Array.from({ length: 16 }, (_, index): RunwayTick => (index % 4 === 2 ? "over" : "under")),
      "today",
      ...Array.from({ length: 13 }, (): RunwayTick => "future"),
    ];
    expect(runwayLabel(ticks, 14)).toBe(
      "Day 17 of 30. 12 days under your daily amount, 4 over. 14 days to payday.",
    );
  });

  it("skips the past on the first day", () => {
    expect(runwayLabel(["today", "future"], 2)).toBe("Day 1 of 2. 2 days to payday.");
  });
});

describe("periodPace", () => {
  it("places the tick at the middle of today", () => {
    const period = { start: "2026-09-25", end: "2026-10-24" };
    expect(periodPace({ period, daysLeft: 14 })).toBeCloseTo(16.5 / 30);
    expect(periodPace({ period, daysLeft: 30 })).toBeCloseTo(0.5 / 30);
  });
});

describe("floorWholeMinor", () => {
  it("drops the fraction of a unit", () => {
    expect(floorWholeMinor(14_275, "AED")).toBe(14_200);
    expect(floorWholeMinor(950, "JPY")).toBe(950);
  });
});

describe("budgetStamp", () => {
  it("prints the day and marks payday", () => {
    expect(budgetStamp("2026-10-11", "2026-09-25")).toBe("SUN 11.10.26");
    expect(budgetStamp("2026-10-25", "2026-10-25")).toBe("SUN 25.10.26 · PAYDAY");
    expect(stampDate(new Date(2026, 9, 12))).toBe("MON 12.10.26");
  });
});

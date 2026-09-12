import { describe, expect, it } from "vitest";

import { periodCeiling } from "./funding-pool";
import { periodLastDate } from "./reserve";

describe("periodCeiling", () => {
  it("returns the first day of the following month", () => {
    expect(periodCeiling("2026-09")).toBe("2026-10-01");
    expect(periodCeiling("2026-01")).toBe("2026-02-01");
  });

  it("rolls December into the next year", () => {
    expect(periodCeiling("2026-12")).toBe("2027-01-01");
  });
});

describe("periodLastDate", () => {
  it("returns the inclusive last calendar day of the period", () => {
    expect(periodLastDate("2026-09")).toBe("2026-09-30");
    expect(periodLastDate("2026-02")).toBe("2026-02-28");
    expect(periodLastDate("2024-02")).toBe("2024-02-29");
  });

  it("handles year-boundary December periods", () => {
    expect(periodLastDate("2026-12")).toBe("2026-12-31");
  });
});

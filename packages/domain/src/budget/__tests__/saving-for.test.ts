import { describe, expect, it } from "vitest";

import { paydaysLeft, savingPerPayday, type SavingGoal } from "../saving-for";

// Payday on the 25th; the current period started 2026-01-25.
const goal: SavingGoal = {
  targetMinor: 1_000_000,
  setAsideMinor: 0,
  dueDate: "2026-04-30",
  rule: { kind: "day", day: 25 },
  currentPeriodStart: "2026-01-25",
};

describe("savingPerPayday", () => {
  it("counts the paydays from the next one through the due date", () => {
    // Feb 25, Mar 25, Apr 25.
    expect(paydaysLeft(goal)).toBe(3);
    expect(paydaysLeft({ ...goal, dueDate: "2026-04-25" })).toBe(3);
    expect(paydaysLeft({ ...goal, dueDate: "2026-04-24" })).toBe(2);
  });

  it("rounds the per-payday amount up", () => {
    // 1,000,000 / 3 = 333,333.33 -> 333,334.
    expect(savingPerPayday(goal)).toBe(333_334);
    expect(savingPerPayday({ ...goal, setAsideMinor: 400_000 })).toBe(200_000);
  });

  it("asks for everything at once when no payday is left before the due date", () => {
    expect(savingPerPayday({ ...goal, dueDate: "2026-02-10" })).toBe(1_000_000);
  });

  it("asks for nothing once the target is met", () => {
    expect(savingPerPayday({ ...goal, setAsideMinor: 1_200_000 })).toBe(0);
  });
});

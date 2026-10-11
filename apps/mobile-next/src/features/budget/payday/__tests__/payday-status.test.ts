import { paydayStatus, type PaydayInputs } from "../payday-status";

const base: PaydayInputs = {
  expectsSalary: true,
  today: "2026-10-25",
  periodStart: "2026-10-25",
  incomeCount: 0,
};

describe("paydayStatus", () => {
  it("is pending on payday while no salary is logged", () => {
    expect(paydayStatus(base)).toEqual({ pending: true, late: false });
  });

  it("stays on time through the first three days", () => {
    expect(paydayStatus({ ...base, today: "2026-10-27" })).toEqual({ pending: true, late: false });
  });

  it("turns late from the fourth day and stays pending for the period", () => {
    expect(paydayStatus({ ...base, today: "2026-10-28" })).toEqual({ pending: true, late: true });
    expect(paydayStatus({ ...base, today: "2026-11-20" })).toEqual({ pending: true, late: true });
  });

  it("is not pending once an income is logged in the period", () => {
    expect(paydayStatus({ ...base, incomeCount: 1 })).toEqual({ pending: false });
  });

  it("is not pending without an expected salary", () => {
    expect(paydayStatus({ ...base, expectsSalary: false })).toEqual({ pending: false });
  });

  it("does not flash a banner while the income lookup is still loading", () => {
    expect(paydayStatus({ ...base, incomeCount: null })).toEqual({ pending: false });
  });
});

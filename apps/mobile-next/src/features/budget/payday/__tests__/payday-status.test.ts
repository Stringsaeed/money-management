import { paydayStatus, salaryWindowStart, type PaydayInputs } from "../payday-status";

const base: PaydayInputs = {
  expectsSalary: true,
  today: "2026-10-25",
  periodStart: "2026-10-25",
  activationPeriodStart: "2026-09-25",
  activatedOn: "2026-09-25",
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

  it("is not pending in the activation period when the budget started after payday", () => {
    // Payday is the 25th; the budget started on 2 Nov with the salary already in the balances.
    const activation = {
      ...base,
      today: "2026-11-02",
      periodStart: "2026-10-25",
      activationPeriodStart: "2026-10-25",
    };
    expect(paydayStatus({ ...activation, activatedOn: "2026-11-02" })).toEqual({ pending: false });
    expect(paydayStatus({ ...activation, activatedOn: "2026-10-25" })).toEqual({
      pending: true,
      late: true,
    });
  });

  it("is pending again from the first payday after activation", () => {
    expect(
      paydayStatus({ ...base, activationPeriodStart: "2026-09-25", activatedOn: "2026-10-02" }),
    ).toEqual({ pending: true, late: false });
  });
});

describe("salaryWindowStart", () => {
  it("counts income from seven days before payday, so an early salary is this period's", () => {
    expect(salaryWindowStart("2026-10-25")).toBe("2026-10-18");
    expect(salaryWindowStart("2026-03-01")).toBe("2026-02-22");
  });
});

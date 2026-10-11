import { describe, expect, it } from "vitest";

import {
  projectBudget,
  type BudgetAssignment,
  type BudgetEnvelope,
  type BudgetFacts,
} from "../projection";

// Payday on the 25th. Periods: P1 2026-01-25..2026-02-24, P2 2026-02-25..2026-03-24.
const P1 = "2026-01-25";
const P2 = "2026-02-25";
const groceries: BudgetEnvelope = {
  id: "groceries",
  group: "everyday",
  categoryIds: ["food"],
  startFresh: false,
};
const rent: BudgetEnvelope = {
  id: "rent",
  group: "bills",
  categoryIds: ["home"],
  startFresh: false,
};

function plan(periodStart: string, envelopeId: string, amountMinor: number): BudgetAssignment {
  return {
    periodStart,
    fromEnvelopeId: null,
    toEnvelopeId: envelopeId,
    amountMinor,
    reason: "plan",
  };
}

function facts(overrides: Partial<BudgetFacts>): BudgetFacts {
  return {
    paydays: [{ effectiveFrom: P1, rule: { kind: "day", day: 25 } }],
    activationStart: P1,
    envelopes: [groceries, rent],
    assignments: [],
    spending: [],
    cardPayments: [],
    cashMinor: 0,
    openingCardDebtMinor: 0,
    minorUnitsPerWhole: 100,
    today: "2026-02-10",
    ...overrides,
  };
}

// AED 10,000 cash; AED 2,000 groceries and AED 3,000 rent planned in P1.
const planned = facts({
  cashMinor: 1_000_000,
  assignments: [plan(P1, "groceries", 200_000), plan(P1, "rent", 300_000)],
});

describe("rollover", () => {
  const history = facts({
    cashMinor: 970_000,
    today: "2026-03-01",
    assignments: [plan(P1, "groceries", 100_000), plan(P2, "groceries", 50_000)],
    spending: [{ date: "2026-02-01", categoryId: "food", amountMinor: 30_000, onCard: false }],
  });

  it("carries a positive left into the next period", () => {
    const projection = projectBudget(history);
    expect(projection.periods[0]?.envelopes[0]).toEqual({
      envelopeId: "groceries",
      plannedMinor: 100_000,
      budgetedMinor: 100_000,
      spentMinor: 30_000,
      rolloverMinor: 0,
      leftMinor: 70_000,
    });
    expect(projection.current.envelopes[0]).toEqual({
      envelopeId: "groceries",
      plannedMinor: 50_000,
      budgetedMinor: 50_000,
      spentMinor: 0,
      rolloverMinor: 70_000,
      leftMinor: 120_000,
    });
    expect(projection.current.unassignedMinor).toBe(850_000);
  });

  it("starts fresh and returns the leftover to Not planned yet", () => {
    const projection = projectBudget({
      ...history,
      envelopes: [{ ...groceries, startFresh: true }, rent],
    });
    expect(projection.current.envelopes[0]?.rolloverMinor).toBe(0);
    expect(projection.current.envelopes[0]?.leftMinor).toBe(50_000);
    expect(projection.current.unassignedMinor).toBe(920_000);
  });

  it("does not carry a cash overspend on the envelope; next period's unassigned absorbs it", () => {
    const overspent = facts({
      cashMinor: 850_000,
      assignments: [plan(P1, "groceries", 100_000)],
      spending: [{ date: "2026-02-01", categoryId: "food", amountMinor: 150_000, onCard: false }],
    });

    const during = projectBudget(overspent).current;
    expect(during.envelopes[0]?.leftMinor).toBe(-50_000);
    expect(during.unassignedMinor).toBe(900_000);
    expect(during.safeToSpendMinor).toBe(850_000);

    const next = projectBudget({ ...overspent, today: "2026-02-26" }).current;
    expect(next.period.start).toBe(P2);
    expect(next.envelopes[0]?.rolloverMinor).toBe(0);
    expect(next.envelopes[0]?.leftMinor).toBe(0);
    expect(next.unassignedMinor).toBe(850_000);
  });
});

describe("unassigned identities", () => {
  it("starts from cash minus what is planned", () => {
    expect(projectBudget(planned).current.unassignedMinor).toBe(500_000);
  });

  it("is unchanged by mapped spending from a funding account", () => {
    const current = projectBudget({
      ...planned,
      cashMinor: 960_000,
      spending: [{ date: "2026-02-05", categoryId: "food", amountMinor: 40_000, onCard: false }],
    }).current;
    expect(current.envelopes[0]?.leftMinor).toBe(160_000);
    expect(current.unassignedMinor).toBe(500_000);
  });

  it("rises by income into a funding account", () => {
    expect(projectBudget({ ...planned, cashMinor: 1_250_000 }).current.unassignedMinor).toBe(
      750_000,
    );
  });

  it("nets card spend and the card payment to zero", () => {
    const cardSpend = { date: "2026-02-05", categoryId: "food", amountMinor: 60_000, onCard: true };
    const spent = projectBudget({ ...planned, spending: [cardSpend] }).current;
    expect(spent.cardReserveMinor).toBe(60_000);
    expect(spent.envelopes[0]?.leftMinor).toBe(140_000);
    expect(spent.unassignedMinor).toBe(500_000);

    const paid = projectBudget({
      ...planned,
      cashMinor: 940_000,
      spending: [cardSpend],
      cardPayments: [{ date: "2026-02-08", amountMinor: 60_000 }],
    }).current;
    expect(paid.cardReserveMinor).toBe(0);
    expect(paid.unassignedMinor).toBe(500_000);
  });

  // Review B-H1: cash 5,000; the card owed 1,500 before activation; DEWA (Bills) planned 0.
  // Pay the old 1,500 statement, then spend 1,000 on the card in DEWA.
  it("keeps Not planned yet when a card payment for old debt is followed by card spend", () => {
    const dewa: BudgetEnvelope = {
      id: "dewa",
      group: "bills",
      categoryIds: ["dewa"],
      startFresh: false,
    };
    const oldDebtPaid = facts({
      envelopes: [dewa],
      cashMinor: 350_000,
      openingCardDebtMinor: 150_000,
      cardPayments: [{ date: "2026-02-05", amountMinor: 150_000 }],
    });
    expect(projectBudget(oldDebtPaid).current.unassignedMinor).toBe(350_000);

    const current = projectBudget({
      ...oldDebtPaid,
      spending: [{ date: "2026-02-06", categoryId: "dewa", amountMinor: 100_000, onCard: true }],
    }).current;
    expect(current.envelopes[0]?.leftMinor).toBe(-100_000);
    expect(current.cardReserveMinor).toBe(100_000);
    expect(current.unassignedMinor).toBe(350_000);
    expect(current.safeToSpendMinor).toBe(350_000);
  });

  it("lowers Not planned yet by an unmapped card expense, like an unmapped cash expense", () => {
    const unmappedCard = projectBudget({
      ...planned,
      spending: [{ date: "2026-02-05", categoryId: "gifts", amountMinor: 20_000, onCard: true }],
    }).current;
    const uncategorisedCard = projectBudget({
      ...planned,
      spending: [{ date: "2026-02-05", categoryId: null, amountMinor: 20_000, onCard: true }],
    }).current;
    const unmappedCash = projectBudget({ ...planned, cashMinor: 980_000 }).current;
    expect(unmappedCard.cardReserveMinor).toBe(20_000);
    expect(unmappedCard.unassignedMinor).toBe(480_000);
    expect(uncategorisedCard.unassignedMinor).toBe(480_000);
    expect(unmappedCash.unassignedMinor).toBe(480_000);
  });

  it("reserves new card spend once old debt is paid off and the rest pays the new spend", () => {
    // Old debt 500; paid 800: 500 retires the old debt, 300 pays 300 of the 1,000 new spend.
    const current = projectBudget({
      ...planned,
      cashMinor: 920_000,
      openingCardDebtMinor: 50_000,
      cardPayments: [{ date: "2026-02-08", amountMinor: 80_000 }],
      spending: [{ date: "2026-02-05", categoryId: "food", amountMinor: 100_000, onCard: true }],
    }).current;
    expect(current.cardReserveMinor).toBe(70_000);
    // cash 9,200 - groceries left 1,000 - rent left 3,000 - reserve 700.
    expect(current.unassignedMinor).toBe(450_000);
  });

  it("holds back money assigned to a future period", () => {
    const current = projectBudget({
      ...planned,
      assignments: [...planned.assignments, plan(P2, "rent", 100_000)],
    }).current;
    expect(current.envelopes[1]?.plannedMinor).toBe(300_000);
    expect(current.unassignedMinor).toBe(400_000);
  });
});

describe("safe to spend", () => {
  it("adds Everyday left to unassigned and floors per day to whole AED", () => {
    const current = projectBudget(planned).current;
    expect(current.daysLeft).toBe(15);
    expect(current.safeToSpendMinor).toBe(700_000);
    // 700,000 / 15 = 46,666.67 minor units -> AED 466 per day.
    expect(current.perDayMinor).toBe(46_600);
  });

  it("floors per day to whole units of the currency's own minor unit", () => {
    // Same 700,000 over 15 days = 46,666.67 minor units per day.
    // KWD (1000 minor per whole unit): 46 whole -> 46,000. JPY (1 per whole): 46,666.
    expect(projectBudget({ ...planned, minorUnitsPerWhole: 1000 }).current.perDayMinor).toBe(
      46_000,
    );
    expect(projectBudget({ ...planned, minorUnitsPerWhole: 1 }).current.perDayMinor).toBe(46_666);
  });

  it("gives 0 per day when safe to spend is negative", () => {
    const current = projectBudget({ ...planned, cashMinor: 150_000 }).current;
    expect(current.unassignedMinor).toBe(-350_000);
    expect(current.safeToSpendMinor).toBe(-150_000);
    expect(current.perDayMinor).toBe(0);
  });

  it("counts only today on the last day of the period", () => {
    const current = projectBudget({ ...planned, today: "2026-02-24" }).current;
    expect(current.daysLeft).toBe(1);
    expect(current.perDayMinor).toBe(700_000);
  });
});

describe("budgeted", () => {
  it("counts plan and repeat assignments only, not money moved around the plan", () => {
    const current = projectBudget({
      ...planned,
      assignments: [
        ...planned.assignments,
        {
          periodStart: P1,
          fromEnvelopeId: null,
          toEnvelopeId: "groceries",
          amountMinor: 10_000,
          reason: "repeat",
        },
        {
          periodStart: P1,
          fromEnvelopeId: "rent",
          toEnvelopeId: "groceries",
          amountMinor: 30_000,
          reason: "cover",
        },
        {
          periodStart: P1,
          fromEnvelopeId: "groceries",
          toEnvelopeId: null,
          amountMinor: 5_000,
          reason: "move",
        },
      ],
    }).current;
    expect(current.envelopes.map((e) => [e.envelopeId, e.plannedMinor, e.budgetedMinor])).toEqual([
      ["groceries", 235_000, 210_000],
      ["rent", 270_000, 300_000],
    ]);
  });
});

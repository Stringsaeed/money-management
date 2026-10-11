/**
 * Budget projection (Budgeting v1 engine identity). Pure: every number is
 * derived from the inputs, nothing is stored. Money is integer minor units.
 */
import { budgetPeriods, daysLeftInclusive, type BudgetPeriod, type PaydayChange } from "./periods";

export type EnvelopeGroup = "bills" | "everyday" | "saving";

/** An active envelope. Archived envelopes are left out, so their money returns to Unassigned. */
export interface BudgetEnvelope {
  id: string;
  group: EnvelopeGroup;
  categoryIds: readonly string[];
  startFresh: boolean;
}

/** Why money moved. `plan` and `repeat` set the plan; the rest move money around it. */
export type AssignmentReason = "plan" | "cover" | "move" | "leftover" | "repeat";

/** A null side is Unassigned (Not planned yet). `periodStart` may be a future period. */
export interface BudgetAssignment {
  periodStart: string;
  fromEnvelopeId: string | null;
  toEnvelopeId: string | null;
  amountMinor: number;
  reason: AssignmentReason;
}

/**
 * An expense from a funding account (`onCard: false`) or a credit-card account (`onCard: true`).
 * The engine maps it to an envelope by Category. Pass funding expenses in mapped Categories and
 * EVERY card expense: an unmapped card expense lowers Not planned yet through the card reserve,
 * the same way an unmapped cash expense lowers it through cash.
 */
export interface BudgetSpending {
  date: string;
  categoryId: string | null;
  amountMinor: number;
  onCard: boolean;
}

/** A transfer from a funding account to a credit-card account. */
export interface CardPayment {
  date: string;
  amountMinor: number;
}

export interface BudgetFacts {
  paydays: readonly PaydayChange[];
  activationStart: string;
  envelopes: readonly BudgetEnvelope[];
  assignments: readonly BudgetAssignment[];
  spending: readonly BudgetSpending[];
  cardPayments: readonly CardPayment[];
  /** Sum of current balances of the funding accounts. */
  cashMinor: number;
  /**
   * What the AED credit cards owed just before the activation period started (0 when they owed
   * nothing). Card payments since activation pay this off first; it was never reserved.
   */
  openingCardDebtMinor: number;
  today: string;
}

export interface EnvelopePeriodTotals {
  envelopeId: string;
  /** Net of every assignment in the period (plan, cover, move, leftover, repeat). */
  plannedMinor: number;
  /** Net of the `plan` and `repeat` assignments only: what the plan set, before money moved. */
  budgetedMinor: number;
  spentMinor: number;
  rolloverMinor: number;
  leftMinor: number;
}

export interface PeriodTotals {
  period: BudgetPeriod;
  envelopes: EnvelopePeriodTotals[];
}

export interface CurrentPeriodTotals extends PeriodTotals {
  unassignedMinor: number;
  safeToSpendMinor: number;
  perDayMinor: number;
  daysLeft: number;
  cardReserveMinor: number;
}

export interface BudgetProjection {
  /** Every period from activation through the current one, oldest first. */
  periods: PeriodTotals[];
  current: CurrentPeriodTotals;
}

const WHOLE_AED_MINOR = 100;

export function projectBudget(facts: BudgetFacts): BudgetProjection {
  const periods = budgetPeriods(facts.paydays, facts.activationStart, facts.today);
  const envelopeByCategory = new Map<string, string>();
  for (const envelope of facts.envelopes) {
    for (const categoryId of envelope.categoryIds) envelopeByCategory.set(categoryId, envelope.id);
  }

  const totals: PeriodTotals[] = [];
  let previous: EnvelopePeriodTotals[] | null = null;
  for (const period of periods) {
    const envelopes = facts.envelopes.map((envelope, index) =>
      envelopeTotals(facts, envelopeByCategory, period, envelope, previous?.[index] ?? null),
    );
    totals.push({ period, envelopes });
    previous = envelopes;
  }

  const current = totals[totals.length - 1];
  if (!current) throw new Error("A budget always has a current period.");
  return { periods: totals, current: currentTotals(facts, current) };
}

function envelopeTotals(
  facts: BudgetFacts,
  envelopeByCategory: ReadonlyMap<string, string>,
  period: BudgetPeriod,
  envelope: BudgetEnvelope,
  previous: EnvelopePeriodTotals | null,
): EnvelopePeriodTotals {
  const { plannedMinor, budgetedMinor } = plannedInto(facts.assignments, period, envelope.id);
  let spentMinor = 0;
  for (const item of facts.spending) {
    if (
      item.categoryId !== null &&
      within(period, item.date) &&
      envelopeByCategory.get(item.categoryId) === envelope.id
    ) {
      spentMinor += item.amountMinor;
    }
  }
  const rolloverMinor = envelope.startFresh || !previous ? 0 : Math.max(previous.leftMinor, 0);
  return {
    envelopeId: envelope.id,
    plannedMinor,
    budgetedMinor,
    spentMinor,
    rolloverMinor,
    leftMinor: rolloverMinor + plannedMinor - spentMinor,
  };
}

/** Net assignments into the envelope in the period: all of them, and the plan-setting ones. */
function plannedInto(
  assignments: readonly BudgetAssignment[],
  period: BudgetPeriod,
  envelopeId: string,
): Pick<EnvelopePeriodTotals, "plannedMinor" | "budgetedMinor"> {
  let plannedMinor = 0;
  let budgetedMinor = 0;
  for (const assignment of assignments) {
    if (!within(period, assignment.periodStart)) continue;
    const netMinor = netInto(assignment, envelopeId);
    plannedMinor += netMinor;
    if (assignment.reason === "plan" || assignment.reason === "repeat") budgetedMinor += netMinor;
  }
  return { plannedMinor, budgetedMinor };
}

function currentTotals(facts: BudgetFacts, current: PeriodTotals): CurrentPeriodTotals {
  const cardReserveMinor = cardReserve(facts);
  const futureAssignedMinor = futureAssigned(facts, current.period);
  const everydayIds = new Set(
    facts.envelopes.filter((envelope) => envelope.group === "everyday").map((e) => e.id),
  );
  let leftMinor = 0;
  let everydayLeftMinor = 0;
  for (const envelope of current.envelopes) {
    leftMinor += envelope.leftMinor;
    if (everydayIds.has(envelope.envelopeId)) everydayLeftMinor += envelope.leftMinor;
  }

  const unassignedMinor = facts.cashMinor - leftMinor - futureAssignedMinor - cardReserveMinor;
  const safeToSpendMinor = everydayLeftMinor + unassignedMinor;
  const daysLeft = daysLeftInclusive(facts.today, current.period.end);
  return {
    ...current,
    unassignedMinor,
    safeToSpendMinor,
    perDayMinor: perDay(safeToSpendMinor, daysLeft),
    daysLeft,
    cardReserveMinor,
  };
}

/** Net assignments into active envelopes for periods after `current`. */
function futureAssigned(facts: BudgetFacts, current: BudgetPeriod): number {
  let totalMinor = 0;
  for (const assignment of facts.assignments) {
    if (assignment.periodStart <= current.end) continue;
    for (const envelope of facts.envelopes) totalMinor += netInto(assignment, envelope.id);
  }
  return totalMinor;
}

/**
 * Card spending since activation that is not paid off yet, never below zero. Payments first
 * retire the debt the cards had before activation, so paying an old statement cannot cancel the
 * reserve held for newer card spending.
 */
function cardReserve(facts: BudgetFacts): number {
  let spentMinor = 0;
  for (const item of facts.spending) {
    if (item.onCard && item.date >= facts.activationStart) spentMinor += item.amountMinor;
  }
  let paidMinor = 0;
  for (const payment of facts.cardPayments) {
    if (payment.date >= facts.activationStart) paidMinor += payment.amountMinor;
  }
  const paidTowardNewSpendMinor = Math.max(paidMinor - Math.max(facts.openingCardDebtMinor, 0), 0);
  return Math.max(spentMinor - paidTowardNewSpendMinor, 0);
}

/** Safe to spend per remaining day, floored to whole AED; 0 when nothing is safe to spend. */
function perDay(safeToSpendMinor: number, daysLeft: number): number {
  if (safeToSpendMinor <= 0) return 0;
  return Math.floor(safeToSpendMinor / (daysLeft * WHOLE_AED_MINOR)) * WHOLE_AED_MINOR;
}

function netInto(assignment: BudgetAssignment, envelopeId: string): number {
  if (assignment.toEnvelopeId === envelopeId) return assignment.amountMinor;
  if (assignment.fromEnvelopeId === envelopeId) return -assignment.amountMinor;
  return 0;
}

function within(period: BudgetPeriod, date: string): boolean {
  return period.start <= date && date <= period.end;
}

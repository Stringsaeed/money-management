import type { SQLiteDatabase } from "expo-sqlite";

import type { BudgetProjection, ProjectionRequest } from "./types";
import { loadAccountDependencyFacts } from "./account-dependency-read";
import { evaluateCardBudgetState } from "./card-dependency-evaluator";
import { getEnvelopeSummaries } from "./envelope-projection";
import { calculateFundingPoolThroughPeriod } from "./funding-pool-calculation";
import { addMoney, requireCurrency, requirePeriod } from "./validation";

interface AccountRow {
  id: string;
  currency: string;
  initialBalance: number;
}

export async function getProjection(
  database: SQLiteDatabase,
  request: ProjectionRequest,
): Promise<BudgetProjection | null> {
  const currency = requireCurrency(request.currency);
  const period = requirePeriod(request.period);
  const workspace = await database.getFirstAsync<{ activationPeriod: string }>(
    `SELECT activation_period AS activationPeriod
     FROM budget_workspaces
     WHERE currency = ?`,
    currency,
  );
  if (!workspace || period < workspace.activationPeriod) return null;

  const accounts = await fundingAccounts(database, currency, period);
  const { amountMinor: fundingPoolAmount, attentionReasons } =
    await calculateFundingPoolThroughPeriod(database, accounts, currency, period);

  const facts = await loadAccountDependencyFacts(database, currency, period);
  const cardBudgetState = facts ? evaluateCardBudgetState(facts, period) : null;
  const availableByEnvelope = cardBudgetState?.availability ?? new Map<string, number>();
  const reserveMinor = cardBudgetState
    ? [...cardBudgetState.reserveByAccount.values()].reduce(
        (total, amount) => addMoney(total, amount, currency),
        0,
      )
    : 0;
  const assignedByEnvelope = new Map<string, number>();
  const spentByEnvelope = new Map<string, number>();
  for (const assignment of facts?.assignments ?? []) {
    if (assignment.period !== period) continue;
    if (assignment.sourceEnvelopeId) {
      assignedByEnvelope.set(
        assignment.sourceEnvelopeId,
        addMoney(
          assignedByEnvelope.get(assignment.sourceEnvelopeId) ?? 0,
          -assignment.amountMinor,
          currency,
        ),
      );
    }
    if (assignment.destinationEnvelopeId) {
      assignedByEnvelope.set(
        assignment.destinationEnvelopeId,
        addMoney(
          assignedByEnvelope.get(assignment.destinationEnvelopeId) ?? 0,
          assignment.amountMinor,
          currency,
        ),
      );
    }
  }
  for (const transaction of facts?.transactions ?? []) {
    if (
      transaction.date.slice(0, 7) === period &&
      transaction.type === "expense" &&
      transaction.envelopeId
    ) {
      spentByEnvelope.set(
        transaction.envelopeId,
        addMoney(
          spentByEnvelope.get(transaction.envelopeId) ?? 0,
          transaction.amountMinor,
          currency,
        ),
      );
    }
  }
  const assignedAvailabilityMinor = [...availableByEnvelope.values()].reduce(
    (total, amount) => addMoney(total, amount, currency),
    0,
  );
  const futureUnassignedReservationMinor = (facts?.assignments ?? [])
    .filter((assignment) => assignment.period > period)
    .reduce((total, assignment) => {
      if (assignment.sourceEnvelopeId === null) {
        return addMoney(total, assignment.amountMinor, currency);
      }
      if (assignment.destinationEnvelopeId === null) {
        return addMoney(total, -assignment.amountMinor, currency);
      }
      return total;
    }, 0);
  const money = { currency, amountMinor: fundingPoolAmount };
  const unassignedMoney = {
    currency,
    amountMinor: addMoney(
      fundingPoolAmount,
      -assignedAvailabilityMinor - reserveMinor - futureUnassignedReservationMinor,
      currency,
    ),
  };
  const [envelopes, archivedEnvelopes] = await Promise.all([
    getEnvelopeSummaries(database, currency, period, "active"),
    getEnvelopeSummaries(database, currency, period, "archived"),
  ]);
  return {
    currency,
    period,
    fundingPool: money,
    unassignedMoney,
    budgetHealth:
      attentionReasons.length === 0
        ? { status: "ready", reasons: [] }
        : { status: "needs_attention", reasons: attentionReasons },
    envelopes: applyEnvelopeValues(
      envelopes,
      availableByEnvelope,
      assignedByEnvelope,
      spentByEnvelope,
      currency,
    ),
    archivedEnvelopes: applyEnvelopeValues(
      archivedEnvelopes,
      availableByEnvelope,
      assignedByEnvelope,
      spentByEnvelope,
      currency,
    ),
  };
}

function applyEnvelopeValues(
  envelopes: BudgetProjection["envelopes"],
  availableByEnvelope: ReadonlyMap<string, number>,
  assignedByEnvelope: ReadonlyMap<string, number>,
  spentByEnvelope: ReadonlyMap<string, number>,
  currency: string,
): BudgetProjection["envelopes"] {
  return envelopes.map((envelope) => ({
    ...envelope,
    availableMoney: { currency, amountMinor: availableByEnvelope.get(envelope.id) ?? 0 },
    assignedMoney: { currency, amountMinor: assignedByEnvelope.get(envelope.id) ?? 0 },
    netSpent: { currency, amountMinor: spentByEnvelope.get(envelope.id) ?? 0 },
  }));
}

async function fundingAccounts(
  database: SQLiteDatabase,
  currency: string,
  period: string,
): Promise<AccountRow[]> {
  return database.getAllAsync<AccountRow>(
    `SELECT
       accounts.id,
       accounts.currency,
       accounts.initial_balance AS initialBalance
     FROM funding_memberships
     INNER JOIN accounts ON accounts.id = funding_memberships.account_id
     WHERE funding_memberships.currency = ?
       AND funding_memberships.effective_from_period <= ?
       AND (
         funding_memberships.effective_to_period IS NULL
         OR funding_memberships.effective_to_period >= ?
       )
     ORDER BY accounts.id`,
    currency,
    period,
    period,
  );
}

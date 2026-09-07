import type { SQLiteDatabase } from "@/db/sqlite";

import type { AccountDependencyFacts } from "./account-dependency-read";
import { evaluateCardBudgetState } from "./card-dependency-evaluator";
import { loadAccountDependencyFacts } from "./account-dependency-read";
import type {
  BudgetProjection,
  MoveMoneyBalance,
  MoveMoneyEndpoint,
  MoveMoneyPreview,
  MoveMoneyRequest,
} from "./types";
import { addMoney } from "./validation";

export function applyMoveToProjection(
  projection: BudgetProjection,
  request: MoveMoneyRequest,
  destinationAvailableMinor: number | null = null,
): BudgetProjection {
  const result = structuredClone(projection);
  if (request.sourceEnvelopeId) {
    const source = result.envelopes.find(({ id }) => id === request.sourceEnvelopeId);
    if (source) source.availableMoney.amountMinor -= request.amountMinor;
  } else {
    result.unassignedMoney.amountMinor -= request.amountMinor;
  }
  if (request.destinationEnvelopeId) {
    const destination = result.envelopes.find(({ id }) => id === request.destinationEnvelopeId);
    if (destination) {
      destination.availableMoney.amountMinor =
        destinationAvailableMinor ?? destination.availableMoney.amountMinor + request.amountMinor;
    }
  } else {
    result.unassignedMoney.amountMinor += request.amountMinor;
  }
  return result;
}

export async function buildMoveMoneyPreview(
  database: SQLiteDatabase,
  request: MoveMoneyRequest,
  projection: BudgetProjection,
  facts: AccountDependencyFacts | null | undefined = undefined,
): Promise<MoveMoneyPreview> {
  const beforeSource = endpointBalance(projection, request.sourceEnvelopeId);
  const beforeDestination = endpointBalance(projection, request.destinationEnvelopeId);
  const deficitRouting = await getDeficitRouting(
    database,
    request,
    beforeDestination.amountMinor,
    facts,
  );
  const destinationAvailableMinor = request.destinationEnvelopeId
    ? Math.max(beforeDestination.amountMinor, 0) + deficitRouting.newAvailabilityMinor
    : null;
  const after = applyMoveToProjection(projection, request, destinationAvailableMinor);
  const afterSource = endpointBalance(after, request.sourceEnvelopeId);
  const afterDestination = endpointBalance(after, request.destinationEnvelopeId);
  return {
    currency: request.currency,
    period: request.period,
    amountMinor: request.amountMinor,
    source: { envelopeId: request.sourceEnvelopeId, before: beforeSource, after: afterSource },
    destination: {
      envelopeId: request.destinationEnvelopeId,
      before: beforeDestination,
      after: afterDestination,
    },
    deficitRouting,
  };
}

async function getDeficitRouting(
  database: SQLiteDatabase,
  request: MoveMoneyRequest,
  destinationBeforeMinor: number,
  facts: AccountDependencyFacts | null | undefined,
): Promise<MoveMoneyPreview["deficitRouting"]> {
  if (!request.destinationEnvelopeId) {
    return {
      cashOverspendingMinor: 0,
      unfundedCardSpendingMinor: 0,
      newAvailabilityMinor: request.amountMinor,
    };
  }
  const cashOverspendingMinor = Math.min(Math.max(-destinationBeforeMinor, 0), request.amountMinor);
  const dependencyFacts =
    facts === undefined
      ? await loadAccountDependencyFacts(database, request.currency, request.period)
      : facts;
  const existingUnfunded = dependencyFacts
    ? evaluateCardBudgetState(dependencyFacts, request.period)
        .unfunded.filter(({ envelopeId }) => envelopeId === request.destinationEnvelopeId)
        .reduce((total, entry) => addMoney(total, entry.remainingMinor, request.currency), 0)
    : 0;
  const unfundedCardSpendingMinor = Math.min(
    request.amountMinor - cashOverspendingMinor,
    existingUnfunded,
  );
  return {
    cashOverspendingMinor,
    unfundedCardSpendingMinor,
    newAvailabilityMinor: request.amountMinor - cashOverspendingMinor - unfundedCardSpendingMinor,
  };
}

function endpointBalance(
  projection: BudgetProjection,
  endpoint: MoveMoneyEndpoint,
): MoveMoneyBalance {
  if (!endpoint) return projection.unassignedMoney;
  return (
    projection.envelopes.find(({ id }) => id === endpoint)?.availableMoney ?? {
      currency: projection.currency,
      amountMinor: 0,
    }
  );
}

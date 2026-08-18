import { endOfMonth, format, parseISO } from "date-fns";
import type { SQLiteDatabase } from "expo-sqlite";

import type { BudgetAttentionReason, BudgetProjection, ProjectionRequest } from "./types";
import { loadAccountDependencyFacts } from "./account-dependency-read";
import { evaluateCardBudgetState } from "./card-dependency-evaluator";
import { getEnvelopeSummaries } from "./envelope-projection";
import { addMoney, requireCurrency, requireMinorUnits, requirePeriod } from "./validation";

interface AccountRow {
  id: string;
  currency: string;
  initialBalance: number;
}

interface TransactionRow {
  id: string;
  type: string;
  amount: number;
  currency: string;
  accountId: string;
  toAccountId: string | null;
  sourceCurrency: string;
  destinationCurrency: string | null;
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
  const accountIds = accounts.map(({ id }) => id);
  let fundingPoolAmount = initialFundingPool(accounts, currency);
  const attentionReasons: BudgetAttentionReason[] = [];
  if (accountIds.length > 0) {
    const activity = await activityThroughPeriod(database, accountIds, period);
    const fundingAccountIds = new Set(accountIds);
    for (const transaction of activity) {
      if (isUnsupportedCurrencyTransfer(transaction)) {
        attentionReasons.push({
          kind: "unsupported-cross-currency-transfer",
          transactionId: transaction.id,
          sourceCurrency: transaction.sourceCurrency,
          destinationCurrency: transaction.destinationCurrency,
          recoveryAction: "Replace this transfer with exact same-currency ledger records.",
        });
        continue;
      }
      assertTransactionCurrency(transaction, currency);
      fundingPoolAmount = applyTransaction(
        fundingPoolAmount,
        transaction,
        fundingAccountIds,
        currency,
      );
    }
  }

  if (fundingPoolAmount < 0) {
    attentionReasons.unshift({
      kind: "budget-shortfall",
      currency,
      amountMinor: Math.abs(fundingPoolAmount),
      recoveryAction:
        "Increase the same-currency Funding Pool or move Money back to Unassigned until the shortfall is zero.",
    });
  }

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

function initialFundingPool(accounts: readonly AccountRow[], currency: string): number {
  let amount = 0;
  for (const account of accounts) {
    if (account.currency !== currency) {
      throw new Error(
        `Funding Membership ${account.id} uses ${account.currency}, not workspace currency ${currency}.`,
      );
    }
    amount = addMoney(amount, account.initialBalance, currency);
  }
  return amount;
}

async function activityThroughPeriod(
  database: SQLiteDatabase,
  accountIds: readonly string[],
  period: string,
): Promise<TransactionRow[]> {
  const placeholders = accountIds.map(() => "?").join(", ");
  const endDate = format(endOfMonth(parseISO(`${period}-01`)), "yyyy-MM-dd");
  return database.getAllAsync<TransactionRow>(
    `SELECT
       transactions.id,
       transactions.type,
       transactions.amount,
       transactions.currency,
       transactions.account_id AS accountId,
       transactions.to_account_id AS toAccountId,
       source_accounts.currency AS sourceCurrency,
       destination_accounts.currency AS destinationCurrency
     FROM transactions
     INNER JOIN accounts AS source_accounts ON source_accounts.id = transactions.account_id
     LEFT JOIN accounts AS destination_accounts
       ON destination_accounts.id = transactions.to_account_id
     WHERE transactions.date <= ?
       AND (
         transactions.account_id IN (${placeholders})
         OR transactions.to_account_id IN (${placeholders})
       )
     ORDER BY transactions.date, transactions.created_at, transactions.id`,
    endDate,
    ...accountIds,
    ...accountIds,
  );
}

function isUnsupportedCurrencyTransfer(
  transaction: TransactionRow,
): transaction is TransactionRow & { destinationCurrency: string } {
  return (
    transaction.type === "transfer" &&
    transaction.destinationCurrency !== null &&
    transaction.destinationCurrency !== transaction.sourceCurrency
  );
}

function applyTransaction(
  amount: number,
  transaction: TransactionRow,
  fundingAccountIds: ReadonlySet<string>,
  currency: string,
): number {
  const sourceIsFunding = fundingAccountIds.has(transaction.accountId);
  const destinationIsFunding =
    transaction.toAccountId !== null && fundingAccountIds.has(transaction.toAccountId);

  if (transaction.type === "income") {
    return sourceIsFunding ? addMoney(amount, transaction.amount, currency) : amount;
  }
  if (transaction.type === "expense") {
    return sourceIsFunding ? addMoney(amount, -transaction.amount, currency) : amount;
  }
  if (transaction.type === "transfer") {
    let nextAmount = amount;
    if (sourceIsFunding) nextAmount = addMoney(nextAmount, -transaction.amount, currency);
    if (destinationIsFunding) nextAmount = addMoney(nextAmount, transaction.amount, currency);
    return nextAmount;
  }
  throw new Error(`Cannot calculate Funding Pool with transaction type ${transaction.type}.`);
}

function assertTransactionCurrency(transaction: TransactionRow, currency: string): void {
  requireMinorUnits(transaction.amount, currency);
  if (transaction.currency !== currency || transaction.sourceCurrency !== currency) {
    throw new Error(
      `Cannot calculate ${currency} Funding Pool with ${transaction.currency} ledger Money.`,
    );
  }
}

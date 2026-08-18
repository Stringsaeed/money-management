import type { SQLiteDatabase } from "expo-sqlite";

import type { AccountBudgetDependency } from "./account-lifecycle-types";

interface CardSpendingRow {
  amountMinor: number;
  currency: string;
  envelopeId: string;
  period: string;
}

interface AssignmentRow {
  amountMinor: number;
  destinationEnvelopeId: string | null;
  period: string;
  sourceEnvelopeId: string | null;
}

export async function loadCardBudgetDependencies(
  database: SQLiteDatabase,
  accountId: string,
): Promise<AccountBudgetDependency[]> {
  const account = await database.getFirstAsync<{ currency: string; type: string }>(
    "SELECT currency, type FROM accounts WHERE id = ?",
    accountId,
  );
  if (!account || account.type !== "credit_card") return [];

  const spending = await database.getAllAsync<CardSpendingRow>(
    `SELECT
       transactions.amount AS amountMinor,
       transactions.currency,
       category_mappings.envelope_id AS envelopeId,
       substr(transactions.date, 1, 7) AS period
     FROM transactions
     INNER JOIN category_mappings
       ON category_mappings.category_id = transactions.category_id
      AND category_mappings.effective_from_period <= substr(transactions.date, 1, 7)
      AND (
        category_mappings.effective_to_period IS NULL
        OR category_mappings.effective_to_period >= substr(transactions.date, 1, 7)
      )
     WHERE transactions.account_id = ?
       AND transactions.type = 'expense'
     ORDER BY transactions.date, transactions.created_at, transactions.id`,
    accountId,
  );
  if (spending.length === 0) return [];

  const assignments = await database.getAllAsync<AssignmentRow>(
    `SELECT
       amount_minor AS amountMinor,
       destination_envelope_id AS destinationEnvelopeId,
       budget_period AS period,
       source_envelope_id AS sourceEnvelopeId
     FROM assignments
     WHERE source_envelope_id IS NOT NULL OR destination_envelope_id IS NOT NULL
     ORDER BY budget_period, created_at, id`,
  );
  const assignedByEnvelopePeriod = new Map<string, number>();
  for (const assignment of assignments) {
    if (assignment.destinationEnvelopeId) {
      addToTotal(
        assignedByEnvelopePeriod,
        assignment.destinationEnvelopeId,
        assignment.period,
        assignment.amountMinor,
      );
    }
    if (assignment.sourceEnvelopeId) {
      addToTotal(
        assignedByEnvelopePeriod,
        assignment.sourceEnvelopeId,
        assignment.period,
        -assignment.amountMinor,
      );
    }
  }

  const spendingByEnvelopePeriod = new Map<string, number>();
  for (const transaction of spending) {
    addToTotal(
      spendingByEnvelopePeriod,
      transaction.envelopeId,
      transaction.period,
      transaction.amountMinor,
    );
  }

  let reserveMinor = 0;
  let unfundedMinor = 0;
  for (const [key, amountMinor] of spendingByEnvelopePeriod) {
    const assignedMinor = Math.max(assignedByEnvelopePeriod.get(key) ?? 0, 0);
    const fundedMinor = Math.min(amountMinor, assignedMinor);
    reserveMinor += fundedMinor;
    unfundedMinor += amountMinor - fundedMinor;
  }

  const payments = await database.getFirstAsync<{ amountMinor: number }>(
    `SELECT COALESCE(SUM(amount), 0) AS amountMinor
     FROM transactions
     WHERE type = 'transfer' AND to_account_id = ?`,
    accountId,
  );
  const paymentMinor = payments?.amountMinor ?? 0;
  const remainingReserveMinor = Math.max(reserveMinor - paymentMinor, 0);
  const remainingPaymentMinor = Math.max(paymentMinor - reserveMinor, 0);
  const remainingUnfundedMinor = Math.max(unfundedMinor - remainingPaymentMinor, 0);
  const dependencies: AccountBudgetDependency[] = [];
  if (remainingReserveMinor > 0) {
    dependencies.push({
      kind: "card-payment-reserve",
      currency: account.currency,
      amountMinor: remainingReserveMinor,
    });
  }
  if (remainingUnfundedMinor > 0) {
    dependencies.push({
      kind: "unfunded-card-spending",
      currency: account.currency,
      amountMinor: remainingUnfundedMinor,
    });
  }
  return dependencies;
}

function addToTotal(
  totals: Map<string, number>,
  envelopeId: string,
  period: string,
  amountMinor: number,
): void {
  const key = `${envelopeId}:${period}`;
  totals.set(key, (totals.get(key) ?? 0) + amountMinor);
}

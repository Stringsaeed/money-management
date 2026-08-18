import type { SQLiteDatabase } from "expo-sqlite";

import type { Account, Transaction } from "@/types";

export interface BudgetAccountRow {
  currency: string;
  id: string;
  initialBalance: number;
  type: Account["type"];
}

export interface BudgetAssignmentRow {
  amountMinor: number;
  destinationEnvelopeId: string | null;
  id: string;
  period: string;
  reversesAssignmentId: string | null;
  sourceEnvelopeId: string | null;
}

export interface BudgetMembershipRow {
  accountId: string;
  currency: string;
  effectiveFromPeriod: string;
  effectiveToPeriod: string | null;
}

export interface BudgetRolloverRow {
  effectiveFromPeriod: string;
  envelopeId: string;
  positiveRollover: number;
}

export interface BudgetTransactionRow {
  accountId: string;
  amountMinor: number;
  currency: string;
  date: string;
  destinationCurrency: string | null;
  envelopeId: string | null;
  id: string;
  sourceCurrency: string;
  toAccountId: string | null;
  type: Transaction["type"];
}

export interface AccountDependencyFacts {
  accounts: BudgetAccountRow[];
  activationPeriod: string;
  assignments: BudgetAssignmentRow[];
  memberships: BudgetMembershipRow[];
  rollovers: BudgetRolloverRow[];
  transactions: BudgetTransactionRow[];
}

export interface UnsupportedCrossCurrencyTransferRow {
  accountId: string;
  amountMinor: number;
  destinationCurrency: string;
  id: string;
  sourceCurrency: string;
  toAccountId: string;
}

export async function loadUnsupportedCrossCurrencyTransfers(
  database: SQLiteDatabase,
  accountId: string,
  throughPeriod: string,
): Promise<UnsupportedCrossCurrencyTransferRow[]> {
  return database.getAllAsync<UnsupportedCrossCurrencyTransferRow>(
    `SELECT
       transactions.id,
       transactions.amount AS amountMinor,
       transactions.account_id AS accountId,
       transactions.to_account_id AS toAccountId,
       transactions.currency AS sourceCurrency,
       destination_accounts.currency AS destinationCurrency
     FROM transactions
     INNER JOIN accounts AS source_accounts ON source_accounts.id = transactions.account_id
     INNER JOIN accounts AS destination_accounts
       ON destination_accounts.id = transactions.to_account_id
     WHERE transactions.type = 'transfer'
       AND transactions.date <= ?
       AND (transactions.account_id = ? OR transactions.to_account_id = ?)
       AND (
         transactions.currency <> source_accounts.currency
         OR transactions.currency <> destination_accounts.currency
       )
       AND EXISTS (
         SELECT 1 FROM budget_workspaces
         WHERE currency IN (
           transactions.currency,
           source_accounts.currency,
           destination_accounts.currency
         )
           AND activation_period <= ?
       )
     ORDER BY transactions.date, transactions.created_at, transactions.id`,
    `${throughPeriod}-31`,
    accountId,
    accountId,
    throughPeriod,
  );
}

export async function loadAccountDependencyFacts(
  database: SQLiteDatabase,
  currency: string,
  throughPeriod: string,
): Promise<AccountDependencyFacts | null> {
  const workspace = await database.getFirstAsync<{ activationPeriod: string }>(
    `SELECT activation_period AS activationPeriod
     FROM budget_workspaces WHERE currency = ?`,
    currency,
  );
  if (!workspace || throughPeriod < workspace.activationPeriod) return null;

  const [accounts, assignments, memberships, rollovers, transactions] = await Promise.all([
    database.getAllAsync<BudgetAccountRow>(
      `SELECT id, currency, type, initial_balance AS initialBalance
       FROM accounts WHERE currency = ? ORDER BY id`,
      currency,
    ),
    database.getAllAsync<BudgetAssignmentRow>(
      `SELECT
         id,
         amount_minor AS amountMinor,
         destination_envelope_id AS destinationEnvelopeId,
         budget_period AS period,
         reverses_assignment_id AS reversesAssignmentId,
         source_envelope_id AS sourceEnvelopeId
       FROM assignments
       WHERE currency = ?
       ORDER BY budget_period, created_at, id`,
      currency,
    ),
    database.getAllAsync<BudgetMembershipRow>(
      `SELECT
         account_id AS accountId,
         currency,
         effective_from_period AS effectiveFromPeriod,
         effective_to_period AS effectiveToPeriod
       FROM funding_memberships
       WHERE currency = ? AND effective_from_period <= ?
       ORDER BY effective_from_period, account_id`,
      currency,
      throughPeriod,
    ),
    database.getAllAsync<BudgetRolloverRow>(
      `SELECT
         envelope_id AS envelopeId,
         effective_from_period AS effectiveFromPeriod,
         positive_rollover AS positiveRollover
       FROM rollover_settings
       WHERE effective_from_period <= ?
       ORDER BY effective_from_period, envelope_id`,
      throughPeriod,
    ),
    database.getAllAsync<BudgetTransactionRow>(
      `SELECT
         transactions.id,
         transactions.type,
         transactions.amount AS amountMinor,
         transactions.currency,
         transactions.date,
         transactions.account_id AS accountId,
         transactions.to_account_id AS toAccountId,
         source_accounts.currency AS sourceCurrency,
         destination_accounts.currency AS destinationCurrency,
         (
           SELECT category_mappings.envelope_id
           FROM category_mappings
           INNER JOIN envelopes ON envelopes.id = category_mappings.envelope_id
           WHERE category_mappings.category_id = transactions.category_id
             AND envelopes.currency = ?
             AND category_mappings.effective_from_period <= substr(transactions.date, 1, 7)
             AND (
               category_mappings.effective_to_period IS NULL
               OR category_mappings.effective_to_period >= substr(transactions.date, 1, 7)
             )
           ORDER BY category_mappings.effective_from_period DESC
           LIMIT 1
         ) AS envelopeId
       FROM transactions
       INNER JOIN accounts AS source_accounts ON source_accounts.id = transactions.account_id
       LEFT JOIN accounts AS destination_accounts
         ON destination_accounts.id = transactions.to_account_id
       WHERE transactions.date <= ?
         AND (
           source_accounts.currency = ?
           OR destination_accounts.currency = ?
         )
       ORDER BY transactions.date, transactions.created_at, transactions.id`,
      currency,
      `${throughPeriod}-31`,
      currency,
      currency,
    ),
  ]);

  return {
    accounts,
    activationPeriod: workspace.activationPeriod,
    assignments,
    memberships,
    rollovers,
    transactions,
  };
}

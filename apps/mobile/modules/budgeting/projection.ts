import { endOfMonth, format, parseISO } from "date-fns";
import type { SQLiteDatabase } from "expo-sqlite";

import type { BudgetProjection, ProjectionRequest } from "./types";
import { addMoney, requireCurrency, requireMinorUnits, requirePeriod } from "./validation";

interface AccountRow {
  id: string;
  currency: string;
  initialBalance: number;
}

interface TransactionRow {
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
  if (accountIds.length > 0) {
    const activity = await currentPeriodActivity(database, accountIds, period);
    const fundingAccountIds = new Set(accountIds);
    for (const transaction of activity) {
      assertTransactionCurrency(transaction, currency);
      fundingPoolAmount = applyTransaction(
        fundingPoolAmount,
        transaction,
        fundingAccountIds,
        currency,
      );
    }
  }

  const money = { currency, amountMinor: fundingPoolAmount };
  return {
    currency,
    period,
    fundingPool: money,
    unassignedMoney: { ...money },
  };
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

async function currentPeriodActivity(
  database: SQLiteDatabase,
  accountIds: readonly string[],
  period: string,
): Promise<TransactionRow[]> {
  const placeholders = accountIds.map(() => "?").join(", ");
  const startDate = `${period}-01`;
  const endDate = format(endOfMonth(parseISO(startDate)), "yyyy-MM-dd");
  return database.getAllAsync<TransactionRow>(
    `SELECT
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
     WHERE transactions.date >= ?
       AND transactions.date <= ?
       AND (
         transactions.account_id IN (${placeholders})
         OR transactions.to_account_id IN (${placeholders})
       )
     ORDER BY transactions.date, transactions.created_at, transactions.id`,
    startDate,
    endDate,
    ...accountIds,
    ...accountIds,
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
  if (
    transaction.type === "transfer" &&
    transaction.destinationCurrency !== null &&
    transaction.destinationCurrency !== currency
  ) {
    throw new Error(
      `Cannot calculate ${currency} Funding Pool from a transfer to ${transaction.destinationCurrency}.`,
    );
  }
}

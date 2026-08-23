import { endOfMonth, format, parseISO } from "date-fns";
import type { SQLiteDatabase } from "expo-sqlite";

import type { BudgetAttentionReason } from "./types";
import { addMoney, requireMinorUnits } from "./validation";

export interface FundingPoolAccount {
  id: string;
  currency: string;
  initialBalance: number;
}

interface FundingPoolTransactionRow {
  id: string;
  type: string;
  amount: number;
  currency: string;
  accountId: string;
  toAccountId: string | null;
  sourceCurrency: string;
  destinationCurrency: string | null;
}

export async function calculateFundingPoolThroughPeriod(
  database: SQLiteDatabase,
  accounts: readonly FundingPoolAccount[],
  currency: string,
  period: string,
): Promise<{ amountMinor: number; attentionReasons: BudgetAttentionReason[] }> {
  let amountMinor = initialFundingPool(accounts, currency);
  const attentionReasons: BudgetAttentionReason[] = [];
  const accountIds = accounts.map(({ id }) => id);
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
      amountMinor = applyTransaction(amountMinor, transaction, fundingAccountIds, currency);
    }
  }
  if (amountMinor < 0) {
    attentionReasons.unshift({
      kind: "budget-shortfall",
      currency,
      amountMinor: Math.abs(amountMinor),
      recoveryAction:
        "Increase the same-currency Funding Pool or move Money back to Unassigned until the shortfall is zero.",
    });
  }
  return { amountMinor, attentionReasons };
}

function initialFundingPool(accounts: readonly FundingPoolAccount[], currency: string): number {
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
): Promise<FundingPoolTransactionRow[]> {
  const placeholders = accountIds.map(() => "?").join(", ");
  const endDate = format(endOfMonth(parseISO(`${period}-01`)), "yyyy-MM-dd");
  return database.getAllAsync<FundingPoolTransactionRow>(
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
  transaction: FundingPoolTransactionRow,
): transaction is FundingPoolTransactionRow & { destinationCurrency: string } {
  return (
    transaction.type === "transfer" &&
    transaction.destinationCurrency !== null &&
    transaction.destinationCurrency !== transaction.sourceCurrency
  );
}

function applyTransaction(
  amount: number,
  transaction: FundingPoolTransactionRow,
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

function assertTransactionCurrency(transaction: FundingPoolTransactionRow, currency: string): void {
  requireMinorUnits(transaction.amount, currency);
  if (transaction.currency !== currency || transaction.sourceCurrency !== currency) {
    throw new Error(
      `Cannot calculate ${currency} Funding Pool with ${transaction.currency} ledger Money.`,
    );
  }
}

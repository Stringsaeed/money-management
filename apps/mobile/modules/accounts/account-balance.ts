import type { SQLiteDatabase } from "@/db/sqlite";

import type { AccountWithBalance } from "@/types";

interface AccountBalanceRow extends Omit<AccountWithBalance, "excludeFromTotal"> {
  excludeFromTotal: number;
}

const ACCOUNT_BALANCE_SELECT = `SELECT
  accounts.id,
  accounts.name,
  accounts.type,
  accounts.currency,
  accounts.color,
  accounts.icon,
  accounts.initial_balance AS initialBalance,
  accounts.exclude_from_total AS excludeFromTotal,
  accounts.sort_order AS sortOrder,
  accounts.lifecycle,
  accounts.lifecycle_changed_at AS lifecycleChangedAt,
  accounts.created_at AS createdAt,
  accounts.updated_at AS updatedAt,
  accounts.initial_balance
    + COALESCE(SUM(
        CASE
          WHEN transactions.type = 'income'
            AND transactions.account_id = accounts.id THEN transactions.amount
          WHEN transactions.type = 'expense'
            AND transactions.account_id = accounts.id THEN -transactions.amount
          WHEN transactions.type = 'transfer'
            AND transactions.account_id = accounts.id THEN -transactions.amount
          ELSE 0
        END
      ), 0)
    + COALESCE(SUM(
        CASE
          WHEN transactions.type = 'transfer'
            AND transactions.to_account_id = accounts.id THEN transactions.amount
          ELSE 0
        END
      ), 0) AS balance
FROM accounts
LEFT JOIN transactions
  ON transactions.account_id = accounts.id OR transactions.to_account_id = accounts.id`;

export async function loadAccountBalances(
  database: SQLiteDatabase,
  includeArchived: boolean,
): Promise<AccountWithBalance[]> {
  const lifecycleFilter = includeArchived ? "" : "WHERE accounts.lifecycle = 'active'";
  const rows = await database.getAllAsync<AccountBalanceRow>(
    `${ACCOUNT_BALANCE_SELECT}
     ${lifecycleFilter}
     GROUP BY accounts.id
     ORDER BY accounts.sort_order, accounts.created_at`,
  );
  return rows.map(toAccountWithBalance);
}

export async function loadAccountBalance(
  database: SQLiteDatabase,
  accountId: string,
): Promise<AccountWithBalance | null> {
  const row = await database.getFirstAsync<AccountBalanceRow>(
    `${ACCOUNT_BALANCE_SELECT}
     WHERE accounts.id = ?
     GROUP BY accounts.id`,
    accountId,
  );
  return row ? toAccountWithBalance(row) : null;
}

function toAccountWithBalance(row: AccountBalanceRow): AccountWithBalance {
  return { ...row, excludeFromTotal: row.excludeFromTotal !== 0 };
}

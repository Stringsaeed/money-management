import { format, parseISO, subMonths } from "date-fns";
import type { SQLiteDatabase } from "@/db/sqlite";

export async function endAccountFundingMembership(
  database: SQLiteDatabase,
  accountId: string,
  period: string,
): Promise<void> {
  const priorPeriod = format(subMonths(parseISO(`${period}-01`), 1), "yyyy-MM");
  await database.runAsync(
    `DELETE FROM funding_memberships
     WHERE account_id = ? AND effective_from_period >= ?`,
    accountId,
    period,
  );
  await database.runAsync(
    `UPDATE funding_memberships
     SET effective_to_period = ?
     WHERE account_id = ?
       AND effective_from_period < ?
       AND (effective_to_period IS NULL OR effective_to_period >= ?)`,
    priorPeriod,
    accountId,
    period,
    period,
  );
}

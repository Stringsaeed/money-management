import type { SQLiteDatabase } from "expo-sqlite";

import type { FundingAccountSuggestion, FundingAccountSuggestionsRequest } from "./types";
import { requireCurrency } from "./validation";

interface FundingAccountSuggestionRow {
  id: string;
  currency: string;
  type: FundingAccountSuggestion["type"];
  excludedFromHomeTotal: number;
}

const DEFAULT_FUNDING_ACCOUNT_TYPES = new Set(["checking", "savings", "cash"]);

export async function getFundingAccountSuggestions(
  database: SQLiteDatabase,
  request: FundingAccountSuggestionsRequest,
): Promise<FundingAccountSuggestion[]> {
  const currency = requireCurrency(request.currency);
  const rows = await database.getAllAsync<FundingAccountSuggestionRow>(
    `SELECT
       id,
       currency,
       type,
       exclude_from_total AS excludedFromHomeTotal
     FROM accounts
     WHERE lifecycle = 'active' AND currency = ?
     ORDER BY
       CASE WHEN type IN ('checking', 'savings', 'cash') THEN 0 ELSE 1 END,
       id`,
    currency,
  );
  return rows.map((row) => ({
    id: row.id,
    currency: row.currency,
    type: row.type,
    excludedFromHomeTotal: row.excludedFromHomeTotal !== 0,
    suggested: DEFAULT_FUNDING_ACCOUNT_TYPES.has(row.type),
  }));
}

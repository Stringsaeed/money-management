import type { SQLiteDatabase } from "@/db/sqlite";

import type { FundingAccountSuggestion, FundingAccountSuggestionsRequest } from "./types";
import { isDefaultFundingAccountType } from "./funding-account-eligibility";
import { requireCurrency } from "./validation";

interface FundingAccountSuggestionRow {
  id: string;
  currency: string;
  type: FundingAccountSuggestion["type"];
  excludedFromHomeTotal: number;
}

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
     ORDER BY id`,
    currency,
  );
  return rows
    .map((row) => ({
      id: row.id,
      currency: row.currency,
      type: row.type,
      excludedFromHomeTotal: row.excludedFromHomeTotal !== 0,
      suggested: isDefaultFundingAccountType(row.type),
    }))
    .sort((left, right) => Number(right.suggested) - Number(left.suggested));
}

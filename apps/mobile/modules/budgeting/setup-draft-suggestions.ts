import type { SQLiteDatabase } from "expo-sqlite";

import { loadAccountBalances } from "@/modules/accounts/account-balance";

import type {
  SetupDraftCategorySuggestion,
  SetupDraftFundingAccount,
  SetupDraftPrerequisites,
} from "./setup-draft-types";

const SUGGESTED_FUNDING_TYPES = new Set(["checking", "savings", "cash"]);

interface CategorySuggestionRow {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export async function getSetupDraftPrerequisites(
  database: SQLiteDatabase,
): Promise<SetupDraftPrerequisites> {
  const [accounts, categories] = await Promise.all([
    loadAccountBalances(database, false),
    database.getAllAsync<CategorySuggestionRow>(
      `SELECT id, name, icon, color
       FROM categories
       WHERE lifecycle = 'active' AND type = 'expense'
       ORDER BY sort_order, name, id`,
    ),
  ]);
  const fundingAccounts = accounts.flatMap<SetupDraftFundingAccount>((account) => {
    if (!SUGGESTED_FUNDING_TYPES.has(account.type)) return [];
    return [
      {
        id: account.id,
        name: account.name,
        currency: account.currency,
        type: account.type as SetupDraftFundingAccount["type"],
        icon: account.icon,
        color: account.color,
        balanceMinor: account.balance,
      },
    ];
  });
  const currencies = [...new Set(fundingAccounts.map(({ currency }) => currency))].sort();

  return {
    fundingAccounts,
    categories: categories.map(toCategorySuggestion),
    currencies,
  };
}

function toCategorySuggestion(row: CategorySuggestionRow): SetupDraftCategorySuggestion {
  return row;
}

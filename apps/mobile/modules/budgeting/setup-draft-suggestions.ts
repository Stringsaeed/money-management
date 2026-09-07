import type { SQLiteDatabase } from "@/db/sqlite";

import { loadAccountBalances } from "@/modules/accounts/account-balance";

import {
  isDefaultFundingAccountType,
  isEligibleFundingAccountType,
} from "./funding-account-eligibility";
import type { SetupDraftFundingAccount, SetupDraftPrerequisites } from "./setup-draft-types";

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
    if (!isEligibleFundingAccountType(account.type)) return [];
    return [
      {
        id: account.id,
        name: account.name,
        currency: account.currency,
        type: account.type,
        icon: account.icon,
        color: account.color,
        balanceMinor: account.balance,
        suggested: isDefaultFundingAccountType(account.type),
      },
    ];
  });
  const currencies = [...new Set(fundingAccounts.map(({ currency }) => currency))].sort();

  return {
    fundingAccounts,
    categories,
    currencies,
  };
}

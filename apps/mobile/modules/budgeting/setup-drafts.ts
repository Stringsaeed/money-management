import type { SQLiteDatabase } from "@/db/sqlite";

import { saveSetupDraft } from "./setup-draft-persistence";
import type {
  CreateSetupDraftRequest,
  SetupDraft,
  SetupDraftPrerequisites,
} from "./setup-draft-types";
import { GUIDED_SETUP_DRAFT_ID } from "./setup-draft-types";
import { getSetupDraftPrerequisites } from "./setup-draft-suggestions";
import { requireCurrency } from "./validation";

export async function createSetupDraft(
  database: SQLiteDatabase,
  request: CreateSetupDraftRequest,
): Promise<SetupDraft> {
  const prerequisites = await getSetupDraftPrerequisites(database);
  const currencies = requireSetupCurrencies(request.currencies, prerequisites);
  const primaryCurrency = currencies[0];
  const draft: SetupDraft = {
    version: 1,
    id: GUIDED_SETUP_DRAFT_ID,
    mode: request.mode,
    step: "plan",
    workspaces: currencies.map((currency) => ({
      currency,
      fundingAccountIds: prerequisites.fundingAccounts
        .filter((account) => account.currency === currency && account.suggested)
        .map(({ id }) => id),
      envelopes:
        request.mode === "suggested" && currency === primaryCurrency
          ? prerequisites.categories.map((category, index) => ({
              id: `draft-envelope-${index + 1}-${category.id}`,
              currency,
              name: category.name,
              icon: category.icon,
              color: category.color,
              categoryIds: [category.id],
              positiveRollover: true,
              initialAssignmentMinor: 0,
            }))
          : [],
    })),
    createdAt: request.now,
    updatedAt: request.now,
  };
  await saveSetupDraft(database, {
    draft,
    localDate: request.localDate,
    now: request.now,
  });
  return draft;
}

function requireSetupCurrencies(
  requested: readonly string[],
  prerequisites: SetupDraftPrerequisites,
): string[] {
  const currencies = requested.map(requireCurrency);
  if (currencies.length === 0 || new Set(currencies).size !== currencies.length) {
    throw new Error("Choose at least one distinct currency, then restart the Setup Draft.");
  }
  for (const currency of currencies) {
    if (!prerequisites.currencies.includes(currency)) {
      throw new Error(`${currency} needs an eligible Funding Account before setup can begin.`);
    }
  }
  return currencies;
}

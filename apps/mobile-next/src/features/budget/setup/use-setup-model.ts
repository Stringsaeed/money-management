import {
  useAccountsQuery,
  useBudgetSetupFactsQuery,
  useCategoriesQuery,
} from "@/data/ledger-queries";

import { buildSetupItems } from "./setup-items";
import { fundingChoice, hasInvalidAmount, previewPlan, tickedItems } from "./setup-plan";
import { resolveSetupCurrency } from "./setup-currency";
import { useSetupDraft } from "./use-setup-draft";
import { useSetupTarget } from "./use-setup-target";

/** Everything the setup screens read: the draft joined with the ledger and the facts in the budget currency. */
export function useSetupModel() {
  const setup = useSetupDraft();
  const { draft } = setup;
  const accounts = useAccountsQuery();
  const categories = useCategoriesQuery();
  const target = useSetupTarget();
  const { currency, fixed } = resolveSetupCurrency(target, draft.currency, accounts.data);
  const facts = useBudgetSetupFactsQuery(currency, draft.payday);

  const items = facts.data
    ? buildSetupItems({
        currency,
        facts: facts.data,
        categories: categories.data,
        custom: draft.custom,
      })
    : [];
  const ticked = tickedItems(items, draft.selection);
  const funding = fundingChoice(accounts.data, draft, currency);
  const preview =
    facts.data && draft.payday && !facts.isStale
      ? previewPlan({
          currency,
          facts: facts.data,
          payday: draft.payday,
          items: ticked,
          amounts: draft.amounts,
          funding,
        })
      : null;

  return {
    currency,
    currencyFixed: fixed,
    target,
    needsPayday: setup.ready && draft.payday === null,
    setup,
    draft,
    accounts,
    categories,
    facts,
    items,
    ticked,
    funding,
    preview,
    invalidAmounts: hasInvalidAmount(ticked, draft.amounts, currency),
  };
}

export type SetupModel = ReturnType<typeof useSetupModel>;

import {
  useAccountsQuery,
  useBudgetSetupFactsQuery,
  useCategoriesQuery,
} from "@/data/ledger-queries";

import { buildSetupItems } from "./setup-items";
import {
  cardAccountIds,
  fundingChoice,
  hasInvalidAmount,
  previewPlan,
  tickedItems,
} from "./setup-plan";
import { useSetupDraft } from "./use-setup-draft";

/** Everything the setup screens read: the draft joined with the ledger and the AED facts. */
export function useSetupModel() {
  const setup = useSetupDraft();
  const { draft } = setup;
  const accounts = useAccountsQuery();
  const categories = useCategoriesQuery();
  const facts = useBudgetSetupFactsQuery(draft.payday);

  const items = facts.data
    ? buildSetupItems({
        facts: facts.data,
        categories: categories.data,
        custom: draft.custom,
      })
    : [];
  const ticked = tickedItems(items, draft.selection);
  const funding = fundingChoice(accounts.data, draft);
  const preview =
    facts.data && draft.payday && !facts.isStale
      ? previewPlan({
          facts: facts.data,
          payday: draft.payday,
          items: ticked,
          amounts: draft.amounts,
          funding,
          cardAccountIds: cardAccountIds(accounts.data),
        })
      : null;

  return {
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
    invalidAmounts: hasInvalidAmount(ticked, draft.amounts),
  };
}

export type SetupModel = ReturnType<typeof useSetupModel>;

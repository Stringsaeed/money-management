import { moneyToPlanMinor } from "./setup-accounts";
import { periodLine } from "./setup-copy";
import { parseAmountText, paydayStepReady } from "./setup-plan";
import { useSetupModel } from "./use-setup-model";

/** S2 and H2: the setup model plus what step 1 shows and whether Next can go on. */
export function usePaydayStep() {
  const model = useSetupModel();
  const { draft, setup, accounts, facts, funding, currency } = model;
  const freshFacts = facts.data && !facts.isStale ? facts.data : null;

  return {
    ...model,
    update: setup.update,
    salaryInvalid: parseAmountText(draft.usualSalary, currency) === null,
    needsAccount: funding.openingCashMinor === null && funding.accountIds.length === 0,
    canContinue: setup.ready && !accounts.isLoading && paydayStepReady(draft, funding, currency),
    /** "THIS MONTH: 25 SEP → 24 OCT · 14 DAYS LEFT" once the chosen payday's period is known. */
    period: freshFacts && draft.payday ? periodLine(freshFacts.period, freshFacts.today) : null,
    moneyMinor: moneyToPlanMinor(funding, accounts.data, freshFacts?.accountBalances ?? null),
    tick: (accountId: string, ticked: boolean) =>
      setup.update({ funding: { ...draft.funding, [accountId]: ticked } }),
    setTotal: (openingCash: string) => setup.update({ openingCash }),
  };
}

export type PaydayStep = ReturnType<typeof usePaydayStep>;

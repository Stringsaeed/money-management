import { useLedgerData } from "@/data/ledger-queries";
import { useSession } from "@/features/auth";
import { useHouseholdMembership } from "@/features/household/use-household-membership";

import { CurrencySection } from "./currency-section";
import { FundingSection } from "./funding-section";
import { HouseholdShareCard } from "./household-share-card";
import { HouseholdSharesSection } from "./household-shares-section";
import { PaydaySection } from "./payday-section";
import { SetupFootnote } from "./setup-footnote";
import { rolesLine, shareTiles } from "./setup-household";
import { StepTitle } from "./step-title";
import type { PaydayStep } from "./use-payday-step";

/**
 * H2, the household's step 1: payday, the shared accounts it budgets from, each member's
 * monthly share for reference, the Household share note, and who may do what.
 */
export function HouseholdPaydayStep({ step }: { readonly step: PaydayStep }) {
  const { draft, update, currency, currencyFixed, accounts, funding } = step;
  const { scope } = useLedgerData();
  const session = useSession();
  const { household } = useHouseholdMembership(
    scope.kind === "household" ? scope.householdId : null,
  );
  const userId = session.principal?.kind === "user" ? session.principal.userId : null;
  const roles = rolesLine(household, userId);

  return (
    <>
      <StepTitle
        title="Your Household budget"
        intro="It plans only money in shared accounts. Your Personal budget stays yours."
      />
      <PaydaySection
        payday={draft.payday}
        period={step.period}
        onChange={(payday) => update({ payday })}
      />
      <CurrencySection
        fixed={currencyFixed}
        accounts={accounts.data}
        currency={currency}
        onChange={(chosen) => update({ currency: chosen })}
      />
      <FundingSection
        title="SHARED MONEY IT BUDGETS FROM"
        currency={currency}
        accounts={accounts.data}
        draft={draft}
        showType={false}
        totalInvalid={funding.invalid}
        needsAccount={step.needsAccount}
        loading={accounts.isLoading}
        onTick={step.tick}
        onTotal={step.setTotal}
      />
      <HouseholdSharesSection
        currency={currency}
        tiles={shareTiles(household, userId)}
        shares={draft.householdShares}
        onChange={(memberId, text) =>
          update({ householdShares: { ...draft.householdShares, [memberId]: text } })
        }
      />
      <HouseholdShareCard />
      {roles ? <SetupFootnote emoji="👥" size="sm" text={roles} /> : null}
    </>
  );
}

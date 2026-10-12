import { CurrencySection } from "./currency-section";
import { FundingSection } from "./funding-section";
import { PaydaySection } from "./payday-section";
import { SalaryCard } from "./salary-card";
import { paydayIntro } from "./setup-currency";
import { StepTitle } from "./step-title";
import type { PaydayStep } from "./use-payday-step";

/** S2 content: payday, the salary and reminder card, currency, and the money you have now. */
export function PersonalPaydayStep({ step }: { readonly step: PaydayStep }) {
  const { draft, update, currency, currencyFixed, accounts, funding } = step;
  return (
    <>
      <StepTitle title="When do you get paid?" intro={paydayIntro(currencyFixed, currency)} />
      <PaydaySection
        payday={draft.payday}
        period={step.period}
        onChange={(payday) => update({ payday })}
      />
      <SalaryCard
        currency={currency}
        salary={draft.usualSalary}
        salaryInvalid={step.salaryInvalid}
        onSalary={(usualSalary) => update({ usualSalary })}
        reminder={draft.paydayReminder}
        onReminder={(paydayReminder) => update({ paydayReminder })}
      />
      <CurrencySection
        fixed={currencyFixed}
        accounts={accounts.data}
        currency={currency}
        onChange={(chosen) => update({ currency: chosen })}
      />
      <FundingSection
        title="MONEY YOU HAVE RIGHT NOW"
        currency={currency}
        accounts={accounts.data}
        draft={draft}
        showType
        totalInvalid={funding.invalid}
        needsAccount={step.needsAccount}
        loading={accounts.isLoading}
        onTick={step.tick}
        onTotal={step.setTotal}
      />
    </>
  );
}

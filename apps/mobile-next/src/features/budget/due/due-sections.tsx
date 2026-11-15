import type { ActiveBudgetView } from "../home/home-model";

import type { DueBillsView } from "./due-bills-view";
import { DueListSection } from "./due-list-section";
import { DueNowSection } from "./due-now-section";
import type { PaidBill } from "./due-paid";
import { DuePaidSection } from "./due-paid-section";
import { dueSectionPlan } from "./due-section-plan";
import { DueSnoozedNote } from "./due-snoozed-note";
import { DueEmpty } from "./due-empty";
import { SalaryRow } from "./salary-row";
import type { UseDue } from "./use-due";

interface DueSectionsProps {
  readonly view: ActiveBudgetView;
  readonly due: UseDue;
  readonly paid: readonly PaidBill[];
  readonly bills: DueBillsView;
}

/** Overdue and Today as cards, This week and Next payday as rows, then what is already paid. */
export function DueSections({ view, due, paid, bills }: DueSectionsProps) {
  const salary = view.budget.usualSalaryMinor ?? 0;
  const plan = dueSectionPlan(due.sections, salary > 0);
  return (
    <>
      {plan.length === 0 && paid.length === 0 ? <DueEmpty /> : null}
      {plan.map((section) =>
        section.kind === "now" ? (
          <DueNowSection
            bills={bills}
            items={section.items}
            key={section.key}
            late={section.late}
            title={section.title}
          />
        ) : (
          <DueListSection
            bills={bills}
            footer={
              section.salary ? <SalaryRow amountMinor={salary} payday={due.nextPayday} /> : null
            }
            items={section.items}
            key={section.key}
            title={section.title}
          />
        ),
      )}
      {paid.length > 0 ? (
        <DuePaidSection bills={paid} budgetCurrency={view.budget.currency} />
      ) : null}
      <DueSnoozedNote count={due.snoozedCount} />
    </>
  );
}

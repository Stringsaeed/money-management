import { useCategoriesQuery } from "@/data/ledger-queries";
import { ActionBar, Text } from "@/ui/trove";

import { useBudgetCurrency } from "../currency/use-budget-currency";
import { PanelError } from "../envelope/panel-error";
import type { ActiveBudgetView } from "../home/home-model";
import { PLAN_ADMIN_ONLY } from "../role/budget-role";

import { MoneyToPlanReceipt } from "./money-to-plan-receipt";
import { planPeriodStamp } from "./payday-copy";
import { paydayFlowFacts, paydayStepPosition } from "./payday-flow";
import { stepLeading } from "./payday-nav";
import { PaydayStepFrame } from "./payday-step-frame";
import { PlanChoices } from "./plan-choices";
import { moneyToPlan } from "./plan-month-model";
import { StepTitle } from "./step-title";
import { usePlanMonthScreen } from "./use-plan-month-screen";

/**
 * C3: plan the new month with the money you have, by repeating last month's plan (one atomic
 * batch) or by typing the amounts. Both set plan amounts, so only someone who can edit the plan
 * sees them.
 */
export function PlanMonthContent({ view }: { readonly view: ActiveBudgetView }) {
  const currency = useBudgetCurrency();
  const categories = useCategoriesQuery();
  const screen = usePlanMonthScreen(view);
  const { month } = screen;
  const { current } = view;
  const position = paydayStepPosition("plan", paydayFlowFacts(view));
  const plannedMinor = current.envelopes.reduce((total, totals) => total + totals.plannedMinor, 0);

  return (
    <PaydayStepFrame
      {...stepLeading(position.first)}
      footer={
        <ActionBar
          caption="Only money you have. Expected income never counts."
          primary={{ ...screen.button, loading: screen.busy, onPress: screen.run }}
        />
      }
      of={position.of}
      step={position.step}
      tag="NEW MONTH"
    >
      <StepTitle meta={planPeriodStamp(current.period)} title="Plan your new month" />
      <MoneyToPlanReceipt
        currency={currency}
        lines={moneyToPlan(current.unassignedMinor, plannedMinor, month.incomeMinor)}
        periodStart={current.period.start}
        totalMinor={current.unassignedMinor}
      />
      {current.unassignedMinor < 0 ? (
        <Text accessibilityRole="alert" tone="negative" variant="bodySm">
          You&apos;ve planned or spent more than you have. Lower an envelope below.
        </Text>
      ) : null}
      {month.planAccess === "refused" ? (
        <Text tone="secondary" variant="bodySm">
          {PLAN_ADMIN_ONLY}
        </Text>
      ) : null}
      <PlanChoices
        adjust={screen.adjust}
        categories={categories.data}
        currency={currency}
        mode={screen.mode}
        month={month}
        onMode={screen.setMode}
      />
      <PanelError message={screen.error} />
    </PaydayStepFrame>
  );
}

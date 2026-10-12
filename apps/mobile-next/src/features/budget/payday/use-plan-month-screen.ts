import { router } from "expo-router";
import { useState } from "react";

import { track } from "@/features/analytics";
import { showToast } from "@/ui/trove";

import { useBudgetMoney } from "../currency/use-budget-currency";
import type { ActiveBudgetView } from "../home/home-model";

import { BUDGET_HOME_ROUTE } from "./payday-flow";
import { planPrimary, planPrimaryButton, type PlanMode } from "./plan-month-model";
import { pluralEnvelopes } from "./repeat-card";
import { usePlanAdjust } from "./use-plan-adjust";
import { usePlanMonth } from "./use-plan-month";

/**
 * C3's state: Repeat or Adjust (Repeat by default when it is offered), and the primary action that
 * writes the chosen plan and lands on Budget home.
 */
export function usePlanMonthScreen(view: ActiveBudgetView) {
  const money = useBudgetMoney();
  const month = usePlanMonth(view);
  const adjust = usePlanAdjust(view);
  const [picked, setPicked] = useState<PlanMode | null>(null);
  const offerRepeat = month.repeatAccess === "offered";
  const mode: PlanMode = picked ?? (offerRepeat ? "repeat" : "adjust");
  const { plan } = month;
  const primary = planPrimary({
    canEditPlan: month.planAccess === "allowed",
    mode,
    lastMonth: month.lastMonth,
    repeat: { itemCount: plan.items.length, canRepeat: plan.canRepeat },
    adjust: {
      hasChanges: adjust.result.input !== null,
      hasProblem: adjust.result.problem !== null,
    },
  });

  const finish = () => router.dismissTo(BUDGET_HOME_ROUTE);
  const repeat = async () => {
    if (!(await month.repeat())) return;
    track("plan_repeated", {});
    showToast({
      message: `Planned ${money(plan.totalMinor)} across ${pluralEnvelopes(plan.items.length)}`,
    });
    finish();
  };
  const save = async () => {
    if (!(await adjust.save())) return;
    showToast({ message: "Your plan for this month is set." });
    finish();
  };
  const run = () => {
    if (primary.kind === "repeat") void repeat();
    else if (primary.kind === "adjust") void save();
    else if (primary.kind === "finish") finish();
  };

  return {
    month,
    adjust,
    mode,
    setMode: setPicked,
    button: planPrimaryButton(primary),
    busy: month.busy || adjust.busy,
    error: month.error ?? adjust.error,
    run,
  };
}

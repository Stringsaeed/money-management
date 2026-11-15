import type { V2Category } from "@trove/api/v2/contracts";

import type { PlanMode } from "./plan-month-model";
import { AdjustLink } from "./adjust-link";
import { PlanAdjustSection } from "./plan-adjust-section";
import { RepeatCard } from "./repeat-card";
import type { PlanAdjust } from "./use-plan-adjust";
import type { PlanMonth } from "./use-plan-month";

interface PlanChoicesProps {
  readonly month: PlanMonth;
  readonly adjust: PlanAdjust;
  readonly mode: PlanMode;
  readonly onMode: (mode: PlanMode) => void;
  readonly currency: string;
  readonly categories: readonly V2Category[];
}

/**
 * The two ways to plan: the Repeat card (when last month can be repeated), then either the
 * "Adjust amounts instead" link or, once picked, every envelope's amount to type.
 */
export function PlanChoices({
  month,
  adjust,
  mode,
  onMode,
  currency,
  categories,
}: PlanChoicesProps) {
  const { lastMonth } = month;
  if (month.planAccess !== "allowed") return null;
  return (
    <>
      {month.repeatAccess === "offered" && lastMonth !== "none" ? (
        <RepeatCard
          currency={currency}
          lastMonth={lastMonth}
          onAdjust={() => onMode("adjust")}
          onRetry={() => void month.retryLastMonth()}
          onSelect={() => onMode("repeat")}
          plan={month.plan}
          selected={mode === "repeat"}
        />
      ) : null}
      {mode === "adjust" ? (
        <PlanAdjustSection
          adjust={adjust}
          categories={categories}
          currency={currency}
          previous={month.previous}
        />
      ) : (
        <AdjustLink onPress={() => onMode("adjust")} />
      )}
    </>
  );
}

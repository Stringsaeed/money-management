import type { ReactNode } from "react";

import { useBudgetQuery } from "@/data/ledger-queries";
import { EmptyState, Text } from "@/ui/trove";

import { BudgetLoadError } from "../budget-load-error";
import type { ActiveBudgetView } from "../home/home-model";

import { closePaydayFlow } from "./payday-nav";
import { PaydayStepFrame } from "./payday-step-frame";

interface PaydayGateProps {
  /** The step's mono tag while the budget loads or fails, e.g. "WRAP-UP". */
  readonly tag: string;
  /** Leaves the flow; defaults to Budget home. */
  readonly onClose?: () => void;
  readonly children: (view: ActiveBudgetView) => ReactNode;
}

/**
 * Loads the budget for a payday screen, with honest loading, error and no-budget states. A failed
 * refresh hides the numbers too, so Money to plan and Repeat never run on an old budget.
 */
export function PaydayGate({ tag, onClose = closePaydayFlow, children }: PaydayGateProps) {
  const budget = useBudgetQuery();
  if (!budget.isError && budget.data?.budget) return children(budget.data);
  return (
    <PaydayStepFrame leading="close" onLeading={onClose} tag={tag}>
      {budget.isError ? (
        <BudgetLoadError stale={budget.data !== undefined} onRetry={() => void budget.retry()} />
      ) : !budget.data ? (
        <Text accessibilityLiveRegion="polite" tone="secondary" variant="bodySm">
          Loading your budget…
        </Text>
      ) : (
        <EmptyState
          title="No budget yet"
          message="Set up a budget to plan each payday."
          framed={false}
        />
      )}
    </PaydayStepFrame>
  );
}

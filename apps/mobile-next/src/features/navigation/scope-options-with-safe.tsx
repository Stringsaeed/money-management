import type { ComponentProps } from "react";

import { useBudgetQuery } from "@/data/ledger-queries";
import { compactAmount } from "@/ui/trove";

import { ScopeOptions } from "./scope-options";

type ScopeOptionsWithSafeProps = Omit<ComponentProps<typeof ScopeOptions>, "activeSafe">;

/**
 * ScopeOptions with the on-screen ledger's Safe to spend, read from the budget it already
 * loads. The other ledger's figure would need its own budget request, so it shows none.
 */
export function ScopeOptionsWithSafe(props: ScopeOptionsWithSafeProps) {
  const budget = useBudgetQuery();
  const view = budget.data;
  const activeSafe =
    view?.budget && !budget.isError
      ? `${view.current.safeToSpendMinor < 0 ? "−" : ""}${compactAmount(view.current.safeToSpendMinor, view.budget.currency)}`
      : null;
  return <ScopeOptions {...props} activeSafe={activeSafe} />;
}

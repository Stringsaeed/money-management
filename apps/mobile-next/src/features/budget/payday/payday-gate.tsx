import type { ReactNode } from "react";
import { StyleSheet } from "react-native";

import { useBudgetQuery } from "@/data/ledger-queries";
import { EmptyState, layout, Screen, space, Text } from "@/ui/trove";

import { BudgetLoadError } from "../budget-load-error";
import type { ActiveBudgetView } from "../home/home-model";
import { SetupHeader } from "../setup/setup-header";

interface PaydayGateProps {
  /** Compact header title while the budget loads or fails. */
  readonly title: string;
  readonly children: (view: ActiveBudgetView) => ReactNode;
}

/**
 * Loads the budget for a payday screen, with honest loading, error and no-budget states. A failed
 * refresh hides the numbers too, so Money to plan and Repeat never run on an old budget.
 */
export function PaydayGate({ title, children }: PaydayGateProps) {
  const budget = useBudgetQuery();
  if (budget.isError) {
    return (
      <Screen>
        <SetupHeader title={title} />
        <BudgetLoadError stale={budget.data !== undefined} onRetry={() => void budget.retry()} />
      </Screen>
    );
  }
  if (!budget.data) {
    return (
      <Screen>
        <SetupHeader title={title} />
        <Text style={styles.status} tone="secondary" variant="bodySm">
          Loading your budget…
        </Text>
      </Screen>
    );
  }
  if (!budget.data.budget) {
    return (
      <Screen>
        <SetupHeader title={title} />
        <EmptyState
          title="No budget yet"
          message="Set up a budget to plan each payday."
          framed={false}
        />
      </Screen>
    );
  }
  return children(budget.data);
}

const styles = StyleSheet.create({
  status: { padding: layout.screenGutter, paddingTop: space[5] },
});

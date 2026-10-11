import type { ReactNode } from "react";
import { StyleSheet } from "react-native";

import { useBudgetQuery } from "@/data/ledger-queries";
import { spacing } from "@/ui/design-tokens";
import { EmptyState } from "@/ui/empty-state";
import { Screen } from "@/ui/screen";
import { Text } from "@/ui/text";

import type { ActiveBudgetView } from "../home/home-model";

interface PaydayGateProps {
  readonly children: (view: ActiveBudgetView) => ReactNode;
}

/** Loads the budget for a payday screen, with honest loading, error and no-budget states. */
export function PaydayGate({ children }: PaydayGateProps) {
  const budget = useBudgetQuery();
  if (budget.isError && !budget.data) {
    return (
      <Screen edges={["bottom"]}>
        <EmptyState
          title="Couldn't load your budget"
          message="Check your connection and try again."
          onRetry={() => void budget.retry()}
        />
      </Screen>
    );
  }
  if (!budget.data) {
    return (
      <Screen edges={["bottom"]}>
        <Text variant="caption" style={styles.status}>
          Loading your budget…
        </Text>
      </Screen>
    );
  }
  if (!budget.data.budget) {
    return (
      <Screen edges={["bottom"]}>
        <EmptyState title="No budget yet" message="Set up a budget to plan each payday." />
      </Screen>
    );
  }
  return children(budget.data);
}

const styles = StyleSheet.create({
  status: { padding: spacing[5] },
});

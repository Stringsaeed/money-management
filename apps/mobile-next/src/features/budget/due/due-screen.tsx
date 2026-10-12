import { StyleSheet } from "react-native";

import { useBudgetQuery } from "@/data/ledger-queries";
import { EmptyState, space, Text } from "@/ui/trove";

import { BudgetLoadError } from "../budget-load-error";

import { DueContent } from "./due-content";
import { DueFrame } from "./due-frame";

/** M3: bills to pay, from overdue to the next payday. */
export function DueScreen() {
  const budget = useBudgetQuery();

  if (budget.isError) {
    return (
      <DueFrame>
        <BudgetLoadError stale={budget.data !== undefined} onRetry={() => void budget.retry()} />
      </DueFrame>
    );
  }
  if (!budget.data) {
    return (
      <DueFrame>
        <Text variant="bodySm" tone="secondary" style={styles.status}>
          Loading your bills…
        </Text>
      </DueFrame>
    );
  }
  if (!budget.data.budget) {
    return (
      <DueFrame>
        <EmptyState
          title="No budget yet"
          message="Set up a budget to see the bills due."
          framed={false}
        />
      </DueFrame>
    );
  }
  return <DueContent view={budget.data} />;
}

const styles = StyleSheet.create({
  status: { paddingVertical: space[5] },
});

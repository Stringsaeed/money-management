import { StyleSheet } from "react-native";

import { useBudgetQuery } from "@/data/ledger-queries";
import { EmptyState, layout, Screen, space, Text } from "@/ui/trove";

import { BudgetLoadError } from "../budget-load-error";

import { DueContent } from "./due-content";
import { DueHeader } from "./due-header";

/** M3: bills to pay, from overdue to the next payday. */
export function DueScreen() {
  const budget = useBudgetQuery();

  if (budget.isError) {
    return (
      <Screen style={styles.screen}>
        <DueHeader />
        <BudgetLoadError stale={budget.data !== undefined} onRetry={() => void budget.retry()} />
      </Screen>
    );
  }
  if (!budget.data) {
    return (
      <Screen style={styles.screen}>
        <DueHeader />
        <Text variant="bodySm" tone="secondary" style={styles.status}>
          Loading your bills…
        </Text>
      </Screen>
    );
  }
  if (!budget.data.budget) {
    return (
      <Screen style={styles.screen}>
        <DueHeader />
        <EmptyState
          title="No budget yet"
          message="Set up a budget to see the bills due."
          framed={false}
        />
      </Screen>
    );
  }
  return <DueContent view={budget.data} />;
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: layout.screenGutter },
  status: { paddingVertical: space[5] },
});

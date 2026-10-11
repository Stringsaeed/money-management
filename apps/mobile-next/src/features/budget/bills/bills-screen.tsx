import { StyleSheet } from "react-native";

import { useBudgetQuery } from "@/data/ledger-queries";
import { EmptyState, layout, Screen, space, Text } from "@/ui/trove";

import { BudgetLoadError } from "../budget-load-error";

import { BillsHeader } from "./bills-header";
import { BillsView, type BillsTab } from "./bills-view";

/** B1 entry: load the budget, then show Bills & big payments or say why it can't be shown. */
export function BillsScreen({ initialTab }: { readonly initialTab: BillsTab }) {
  const budget = useBudgetQuery();

  if (budget.isError) {
    return (
      <Screen style={styles.screen}>
        <BillsHeader />
        <BudgetLoadError stale={budget.data !== undefined} onRetry={() => void budget.retry()} />
      </Screen>
    );
  }
  if (!budget.data) {
    return (
      <Screen style={styles.screen}>
        <BillsHeader />
        <Text variant="bodySm" tone="secondary" style={styles.status}>
          Loading bills…
        </Text>
      </Screen>
    );
  }
  if (!budget.data.budget) {
    return (
      <Screen style={styles.screen}>
        <BillsHeader />
        <EmptyState
          title="No budget yet"
          message="Set up your budget to plan bills."
          framed={false}
        />
      </Screen>
    );
  }
  return <BillsView view={budget.data} initialTab={initialTab} />;
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: layout.screenGutter },
  status: { paddingVertical: space[5] },
});

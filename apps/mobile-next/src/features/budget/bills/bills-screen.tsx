import { StyleSheet, View } from "react-native";

import { useBudgetQuery } from "@/data/ledger-queries";
import { EmptyState, layout, Screen, space, Text } from "@/ui/trove";

import { BudgetLoadError } from "../budget-load-error";

import { BillsHeader } from "./bills-header";
import { BILLS_TOP_GAP, type BillsTab } from "./bills-tab";
import { BillsView } from "./bills-view";

/** B1 entry: load the budget, then show Bills & big payments or say why it can't be shown. */
export function BillsScreen({ initialTab }: { readonly initialTab: BillsTab }) {
  const budget = useBudgetQuery();

  if (!budget.isError && budget.data?.budget) {
    return <BillsView view={budget.data} initialTab={initialTab} />;
  }
  return (
    <Screen edges={["top"]}>
      <View style={styles.content}>
        <BillsHeader />
        {budget.isError ? (
          <BudgetLoadError stale={budget.data !== undefined} onRetry={() => void budget.retry()} />
        ) : !budget.data ? (
          <Text variant="bodySm" tone="secondary" style={styles.status}>
            Loading bills…
          </Text>
        ) : (
          <EmptyState
            title="No budget yet"
            message="Set up your budget to plan bills."
            framed={false}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 16, paddingHorizontal: layout.screenGutter, paddingTop: BILLS_TOP_GAP },
  status: { paddingVertical: space[5] },
});

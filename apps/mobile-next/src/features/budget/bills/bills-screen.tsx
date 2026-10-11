import { StyleSheet } from "react-native";

import { useBudgetQuery } from "@/data/ledger-queries";
import { spacing } from "@/ui/design-tokens";
import { EmptyState } from "@/ui/empty-state";
import { Screen } from "@/ui/screen";
import { Text } from "@/ui/text";

import { BillsView, type BillsTab } from "./bills-view";

/** B1 entry: load the budget, then show Bills & big payments or say why it can't be shown. */
export function BillsScreen({ initialTab }: { readonly initialTab: BillsTab }) {
  const budget = useBudgetQuery();

  if (budget.isError && !budget.data?.budget) {
    return (
      <Screen edges={["bottom"]}>
        <EmptyState
          title="Couldn't load your bills"
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
          Loading bills…
        </Text>
      </Screen>
    );
  }
  if (!budget.data.budget) {
    return (
      <Screen edges={["bottom"]}>
        <EmptyState title="No budget yet" message="Set up your budget to plan bills." />
      </Screen>
    );
  }
  return <BillsView view={budget.data} initialTab={initialTab} />;
}

const styles = StyleSheet.create({ status: { padding: spacing[5] } });

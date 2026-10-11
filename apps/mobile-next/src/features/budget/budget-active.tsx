import { StyleSheet, View } from "react-native";

import { BUDGET_CURRENCY, type V2BudgetView } from "@trove/api/v2/contracts";

import { spacing } from "@/ui/design-tokens";
import { Text } from "@/ui/text";
import { formatMoneyMinor } from "@/utils/money";

type ActiveBudget = Exclude<V2BudgetView, { budget: null }>;

/** Placeholder until Budget home: confirms the budget exists and shows its headline numbers. */
export function BudgetActive({ view }: { readonly view: ActiveBudget }) {
  const { current } = view;
  return (
    <View style={styles.container}>
      <Text variant="headline">Budget is active</Text>
      <View style={styles.hero}>
        <Text variant="label">Safe to spend</Text>
        <Text variant="amount">{formatMoneyMinor(current.safeToSpendMinor, BUDGET_CURRENCY)}</Text>
        <Text variant="caption">
          {`${formatMoneyMinor(current.perDayMinor, BUDGET_CURRENCY)} a day for ${current.daysLeft} ${current.daysLeft === 1 ? "day" : "days"}`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing[4] },
  hero: { gap: spacing[1] },
});

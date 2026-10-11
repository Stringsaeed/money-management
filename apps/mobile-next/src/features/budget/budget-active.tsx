import { StyleSheet, View } from "react-native";

import { BUDGET_CURRENCY, type V2BudgetView } from "@trove/api/v2/contracts";

import { Amount, space, Text } from "@/ui/trove";
import { formatMoneyMinor } from "@/utils/money";

type ActiveBudget = Exclude<V2BudgetView, { budget: null }>;

/** Placeholder until Budget home: confirms the budget exists and shows its headline numbers. */
export function BudgetActive({ view }: { readonly view: ActiveBudget }) {
  const { current } = view;
  return (
    <View style={styles.container}>
      <Text variant="titleLg">Budget is active</Text>
      <View style={styles.hero}>
        <Text tone="secondary" variant="labelSm">
          Safe to spend
        </Text>
        <Amount currency={BUDGET_CURRENCY} minor={current.safeToSpendMinor} size="hero" />
        <Text tone="secondary" variant="bodySm">
          {`${formatMoneyMinor(current.perDayMinor, BUDGET_CURRENCY)} a day for ${current.daysLeft} ${current.daysLeft === 1 ? "day" : "days"}`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: space[4] },
  hero: { gap: space[1] },
});

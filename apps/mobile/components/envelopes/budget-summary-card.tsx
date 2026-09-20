import { View } from "react-native";

import { Text } from "@/components/ui/text";
import type { Money } from "@/modules/budgeting/budgeting";
import { formatCents } from "@/utils/currency";

import { styles } from "./styles";

interface BudgetSummaryCardProps {
  money: Money;
}

export function BudgetSummaryCard({ money }: BudgetSummaryCardProps) {
  const shortfall = money.amountMinor < 0;
  return (
    <View style={styles.budgetSummaryCard}>
      <Text style={styles.textMediumSmInk60}>
        {shortfall ? "Budget Shortfall" : "Unassigned Money"}
      </Text>
      <Text selectable style={styles.budgetSummaryAmount}>
        {formatCents(Math.abs(money.amountMinor), money.currency)}
      </Text>
    </View>
  );
}

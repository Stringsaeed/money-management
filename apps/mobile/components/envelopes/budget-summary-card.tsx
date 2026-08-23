import { View } from "react-native";

import { Text } from "@/components/ui/text";
import type { Money } from "@/modules/budgeting/budgeting";
import { formatCents } from "@/utils/currency";

interface BudgetSummaryCardProps {
  money: Money;
}

export function BudgetSummaryCard({ money }: BudgetSummaryCardProps) {
  const shortfall = money.amountMinor < 0;
  return (
    <View className="gap-1 rounded-3xl border border-ledger-outline bg-surface-container px-5 py-4">
      <Text className="font-body-medium text-sm text-ink/60">
        {shortfall ? "Budget Shortfall" : "Unassigned Money"}
      </Text>
      <Text
        selectable
        className="font-heading-medium text-3xl italic text-ink"
        style={{ fontVariant: ["tabular-nums"] }}
      >
        {formatCents(Math.abs(money.amountMinor), money.currency)}
      </Text>
    </View>
  );
}

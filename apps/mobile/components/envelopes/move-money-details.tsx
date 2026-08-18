import { TextInput, View } from "react-native";

import { Text } from "@/components/ui/text";

interface MoveMoneyDetailsProps {
  amount: string;
  onAmountChange: (amount: string) => void;
  onPeriodChange: (period: string) => void;
  period: string;
}

export function MoveMoneyDetails({
  amount,
  onAmountChange,
  onPeriodChange,
  period,
}: MoveMoneyDetailsProps) {
  return (
    <View className="gap-4">
      <View className="gap-2">
        <Text className="font-body-medium text-sm text-ink">Amount (minor units)</Text>
        <TextInput
          accessibilityLabel="Move Money amount"
          className="h-12 rounded-xl border border-ledger-outline bg-surface-container px-4 font-body-normal text-base text-ink"
          keyboardType="number-pad"
          onChangeText={onAmountChange}
          placeholder="e.g. 2500"
          value={amount}
        />
      </View>
      <View className="gap-2">
        <Text className="font-body-medium text-sm text-ink">Budget Period</Text>
        <TextInput
          accessibilityHint="Enter the current or a future Budget Period as YYYY-MM."
          accessibilityLabel="Move Money period"
          autoCapitalize="none"
          className="h-12 rounded-xl border border-ledger-outline bg-surface-container px-4 font-body-normal text-base text-ink"
          onChangeText={onPeriodChange}
          placeholder="YYYY-MM"
          value={period}
        />
      </View>
    </View>
  );
}

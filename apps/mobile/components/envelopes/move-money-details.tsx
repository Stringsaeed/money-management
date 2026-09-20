import { TextInput, View } from "react-native";

import { Text } from "@/components/ui/text";
import { colors } from "@/lib/design-tokens";

import { styles } from "./styles";

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
    <View style={styles.gap4}>
      <View style={styles.gap2}>
        <Text style={styles.textMediumInkSm}>Amount (minor units)</Text>
        <TextInput
          accessibilityLabel="Move Money amount"
          keyboardType="number-pad"
          onChangeText={onAmountChange}
          placeholder="e.g. 2500"
          placeholderTextColor={colors.textPlaceholder}
          style={styles.moveMoneyInput}
          value={amount}
        />
      </View>
      <View style={styles.gap2}>
        <Text style={styles.textMediumInkSm}>Budget Period</Text>
        <TextInput
          accessibilityHint="Enter the current or a future Budget Period as YYYY-MM."
          accessibilityLabel="Move Money period"
          autoCapitalize="none"
          onChangeText={onPeriodChange}
          placeholder="YYYY-MM"
          placeholderTextColor={colors.textPlaceholder}
          style={styles.moveMoneyInput}
          value={period}
        />
      </View>
    </View>
  );
}

import { StyleSheet, View } from "react-native";

import { BUDGET_CURRENCY } from "@trove/api/v2/contracts";

import { spacing } from "@/ui/design-tokens";
import { Text } from "@/ui/text";
import { TextField } from "@/ui/text-field";
import { formatMoneyMinor } from "@/utils/money";

import type { SetupItem } from "./setup-items";

interface AmountRowProps {
  readonly item: SetupItem;
  readonly value: string;
  readonly invalid: boolean;
  readonly onChange: (text: string) => void;
}

const hints = (item: SetupItem): string[] => [
  ...(item.recurringMinor
    ? [`Recurring: ${formatMoneyMinor(item.recurringMinor, BUDGET_CURRENCY)} a month`]
    : []),
  ...(item.lastPeriodMinor
    ? [`Last period: ${formatMoneyMinor(item.lastPeriodMinor, BUDGET_CURRENCY)}`]
    : []),
];

/** One envelope's monthly amount with its hints. Empty means 0. */
export function AmountRow({ item, value, invalid, onChange }: AmountRowProps) {
  return (
    <View style={styles.row}>
      <TextField
        label={item.name}
        placeholder={`${BUDGET_CURRENCY} 0`}
        keyboardType="decimal-pad"
        value={value}
        onChangeText={onChange}
        error={invalid ? "Enter an amount like 350 or 350.50." : undefined}
      />
      {hints(item).map((hint) => (
        <Text key={hint} variant="caption">
          {hint}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing[1] },
});

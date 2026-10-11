import { StyleSheet, View } from "react-native";

import { space, Text, TextField } from "@/ui/trove";
import { formatMoneyMinor } from "@/utils/money";

import type { SetupItem } from "./setup-items";

interface AmountRowProps {
  readonly currency: string;
  readonly item: SetupItem;
  readonly value: string;
  readonly invalid: boolean;
  readonly onChange: (text: string) => void;
}

const hints = (item: SetupItem, currency: string): string[] => [
  ...(item.recurringMinor
    ? [`Recurring: ${formatMoneyMinor(item.recurringMinor, currency)} a month`]
    : []),
  ...(item.lastPeriodMinor
    ? [`Last period: ${formatMoneyMinor(item.lastPeriodMinor, currency)}`]
    : []),
];

/** One envelope's monthly amount with its hints. Empty means 0. */
export function AmountRow({ currency, item, value, invalid, onChange }: AmountRowProps) {
  return (
    <View style={styles.row}>
      <TextField
        label={item.name}
        placeholder={`${currency} 0`}
        keyboardType="decimal-pad"
        value={value}
        onChangeText={onChange}
        error={invalid ? "Enter an amount like 350 or 350.50." : undefined}
      />
      {hints(item, currency).map((hint) => (
        <Text key={hint} tone="secondary" variant="bodySm">
          {hint}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: space[1] },
});

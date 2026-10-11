import { StyleSheet, View } from "react-native";

import type { V2Account } from "@trove/api/v2/contracts";

import { Chip, space, Text } from "@/ui/trove";

import { ChipRow } from "../quick-add/chip-row";

import { currencyChoices } from "./setup-currency";

interface CurrencySectionProps {
  /** An additional budget's currency is set by the route, so there is nothing to choose. */
  readonly fixed: boolean;
  readonly accounts: readonly V2Account[];
  readonly currency: string;
  readonly onChange: (currency: string) => void;
}

/** First budget only: which currency the budget plans in. Accounts in others stay out of it. */
export function CurrencySection({ fixed, accounts, currency, onChange }: CurrencySectionProps) {
  if (fixed) return null;
  return (
    <View style={styles.group}>
      <Text variant="titleMd">Budget currency</Text>
      <ChipRow label="Your budget plans in one currency">
        {currencyChoices(accounts, currency).map((code) => (
          <Chip
            key={code}
            label={code}
            selected={code === currency}
            onPress={() => onChange(code)}
          />
        ))}
      </ChipRow>
      <Text tone="secondary" variant="bodySm">
        Money in other currencies is never mixed in. You can start a budget for each later.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: space[2] },
});

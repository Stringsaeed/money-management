import { StyleSheet, View } from "react-native";

import type { V2Account } from "@trove/api/v2/contracts";

import { SelectChip, space, Text } from "@/ui/trove";

import { SectionStamp } from "./section-stamp";
import { currencyChoices } from "./setup-currency";

interface CurrencySectionProps {
  /** An additional budget's currency is set by the route, so there is nothing to choose. */
  readonly fixed: boolean;
  readonly accounts: readonly V2Account[];
  readonly currency: string;
  readonly onChange: (currency: string) => void;
}

/**
 * First budget only, and only when the person holds money in more than one currency: which
 * currency the budget plans in. Accounts in the others stay out of it.
 */
export function CurrencySection({ fixed, accounts, currency, onChange }: CurrencySectionProps) {
  const choices = currencyChoices(accounts, currency);
  if (fixed || choices.length < 2) return null;
  return (
    <View style={styles.section}>
      <SectionStamp label="BUDGET CURRENCY" />
      <View
        accessibilityLabel="Budget currency"
        accessibilityRole="radiogroup"
        style={styles.chips}
      >
        {choices.map((code) => (
          <SelectChip
            key={code}
            label={code}
            size="md"
            selected={code === currency}
            onPress={() => onChange(code)}
          />
        ))}
      </View>
      <Text tone="secondary" variant="bodySm">
        One budget per currency. Money in other currencies is never mixed in; you can start a budget
        for each later.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: space[2] },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space[2] },
});

import { StyleSheet, View } from "react-native";

import { Amount, Card, space, Text, type AmountSize } from "@/ui/trove";

import { GalleryGroup } from "./gallery-group";
import { CURRENCIES } from "./sample-data";

const SIZES = ["hero", "lg", "md", "sm"] as const satisfies readonly AmountSize[];

interface CurrencyAmountsProps {
  currency: string;
}

function CurrencyAmounts({ currency }: CurrencyAmountsProps) {
  return (
    <Card style={styles.card}>
      <Text tone="secondary" variant="stamp">
        {currency}
      </Text>
      {SIZES.map((size) => (
        <View key={size} style={styles.line}>
          <Text tone="tertiary" variant="stamp">
            {size}
          </Text>
          <Amount currency={currency} minor={1284503} size={size} />
        </View>
      ))}
      <View style={styles.line}>
        <Text tone="tertiary" variant="stamp">
          negative
        </Text>
        <Amount currency={currency} minor={-6420} />
      </View>
      <View style={styles.line}>
        <Text tone="tertiary" variant="stamp">
          always +
        </Text>
        <Amount currency={currency} minor={420000} signDisplay="always" />
      </View>
      <View style={styles.line}>
        <Text tone="tertiary" variant="stamp">
          isoCode
        </Text>
        <Amount currency={currency} isoCode minor={-6420} />
      </View>
    </Card>
  );
}

export function AmountSamples() {
  return (
    <GalleryGroup label="AMOUNT · USD AED SAR EUR JPY">
      {CURRENCIES.map((currency) => (
        <CurrencyAmounts currency={currency} key={currency} />
      ))}
    </GalleryGroup>
  );
}

const styles = StyleSheet.create({
  card: { gap: space[2] },
  line: { gap: space[0.5] },
});

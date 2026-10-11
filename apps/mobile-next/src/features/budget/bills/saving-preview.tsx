import { StyleSheet, View } from "react-native";

import { Amount, Card, space, Text } from "@/ui/trove";

import { useBudgetCurrency, useBudgetMoney } from "../currency/use-budget-currency";
import type { SavingPreview as SavingPreviewData } from "./big-payment-model";

/** "Set aside each payday", or the warning when the money is due before you're paid. */
export function SavingPreview({ preview }: { readonly preview: SavingPreviewData | null }) {
  const money = useBudgetMoney();
  const currency = useBudgetCurrency();
  return (
    <Card style={styles.card}>
      {preview === null ? (
        <Text tone="secondary" variant="bodySm">
          Add an amount and a due date to see what to set aside.
        </Text>
      ) : (
        <View style={styles.lines} accessibilityLiveRegion="polite">
          {preview.shortBeforePaydayMinor !== null ? (
            <Text accessibilityRole="alert" tone="warning">
              {`Short ${money(preview.shortBeforePaydayMinor)}: due before you're paid`}
            </Text>
          ) : preview.perPaydayMinor === 0 ? (
            <Text>Already fully set aside</Text>
          ) : (
            <>
              <Text tone="secondary" variant="labelSm">
                Set aside each payday
              </Text>
              <Amount currency={currency} minor={preview.perPaydayMinor} size="lg" />
              <Text tone="secondary" variant="bodySm">
                {`${preview.paydaysLeft} ${preview.paydaysLeft === 1 ? "payday" : "paydays"} until it's due`}
              </Text>
            </>
          )}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: space[1] },
  lines: { gap: space[1] },
});

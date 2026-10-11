import { StyleSheet, View } from "react-native";

import { Amount, Card, space, Text } from "@/ui/trove";

import { useBudgetCurrency, useBudgetMoney } from "../currency/use-budget-currency";
import { dueDateLabel } from "./due-date-label";

interface SalaryRowProps {
  readonly amountMinor: number;
  readonly payday: string;
}

/** The usual salary, shown for information: it is not budget money until Got paid posts it. */
export function SalaryRow({ amountMinor, payday }: SalaryRowProps) {
  const money = useBudgetMoney();
  const currency = useBudgetCurrency();
  const amount = money(amountMinor);
  return (
    <Card
      accessible
      accessibilityLabel={`Expected salary ${amount} on ${dueDateLabel(payday)}. Not counted until you tap Got paid.`}
      style={styles.card}
    >
      <View style={styles.top}>
        <Text variant="labelMd">Expected salary</Text>
        <Amount currency={currency} minor={amountMinor} />
      </View>
      <Text tone="secondary" variant="bodySm">
        {dueDateLabel(payday)} · not counted until you tap Got paid
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: space[1] },
  top: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
});

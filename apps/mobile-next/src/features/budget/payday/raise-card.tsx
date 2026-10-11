import { router } from "expo-router";
import { StyleSheet } from "react-native";

import { Button, Card, space, Text } from "@/ui/trove";

import { useBudgetMoney } from "../currency/use-budget-currency";
import { RAISE_PERIODS, type RaiseSuggestion } from "./wrap-up-model";

/** One gentle suggestion; the change itself happens in the envelope's Change plan. */
export function RaiseCard({ suggestion }: { readonly suggestion: RaiseSuggestion }) {
  const money = useBudgetMoney();
  const amount = money(suggestion.suggestedMinor);
  return (
    <Card style={styles.card}>
      <Text>
        {`${suggestion.name} went over ${RAISE_PERIODS} months in a row. Raise it to ${amount}?`}
      </Text>
      <Button
        fullWidth
        label={`Open ${suggestion.name}`}
        variant="secondary"
        onPress={() =>
          router.push({ pathname: "/budget/envelope/[id]", params: { id: suggestion.envelopeId } })
        }
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: space[2] },
});

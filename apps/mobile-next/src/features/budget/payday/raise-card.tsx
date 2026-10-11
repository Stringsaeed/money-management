import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { BUDGET_CURRENCY } from "@trove/api/v2/contracts";

import { Button } from "@/ui/button";
import { colors, radii, spacing } from "@/ui/design-tokens";
import { Text } from "@/ui/text";
import { formatMoneyMinor } from "@/utils/money";

import { RAISE_PERIODS, type RaiseSuggestion } from "./wrap-up-model";

/** One gentle suggestion; the change itself happens in the envelope's Change plan. */
export function RaiseCard({ suggestion }: { readonly suggestion: RaiseSuggestion }) {
  const amount = formatMoneyMinor(suggestion.suggestedMinor, BUDGET_CURRENCY);
  return (
    <View style={styles.card}>
      <Text variant="body">
        {`${suggestion.name} went over ${RAISE_PERIODS} months in a row. Raise it to ${amount}?`}
      </Text>
      <Button
        title={`Open ${suggestion.name}`}
        variant="secondary"
        onPress={() =>
          router.push({ pathname: "/budget/envelope/[id]", params: { id: suggestion.envelopeId } })
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainer,
    borderCurve: "continuous",
    borderRadius: radii.lg,
    gap: spacing[2],
    padding: spacing[4],
  },
});

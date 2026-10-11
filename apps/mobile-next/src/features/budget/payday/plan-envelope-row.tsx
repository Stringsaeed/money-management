import { router } from "expo-router";
import { Pressable, StyleSheet } from "react-native";

import { BUDGET_CURRENCY } from "@trove/api/v2/contracts";

import { colors, radii, spacing } from "@/ui/design-tokens";
import { Text } from "@/ui/text";
import { formatMoneyMinor } from "@/utils/money";

import type { EnvelopeLine } from "../home/home-model";

/** An envelope and what is planned in it this month; opens Envelope detail to change the plan. */
export function PlanEnvelopeRow({ line }: { readonly line: EnvelopeLine }) {
  const planned = formatMoneyMinor(line.totals.plannedMinor, BUDGET_CURRENCY);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${line.envelope.name}, ${planned} planned. Change plan`}
      onPress={() =>
        router.push({ pathname: "/budget/envelope/[id]", params: { id: line.envelope.id } })
      }
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <Text variant="body" numberOfLines={1} style={styles.name}>
        {line.envelope.name}
      </Text>
      <Text variant="caption">{planned}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderCurve: "continuous",
    borderRadius: radii.lg,
    flexDirection: "row",
    gap: spacing[3],
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  pressed: { backgroundColor: colors.surfaceDim },
  name: { flex: 1 },
});

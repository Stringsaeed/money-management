import { StyleSheet, View } from "react-native";

import { BUDGET_CURRENCY } from "@trove/api/v2/contracts";

import { colors, radii, spacing } from "@/ui/design-tokens";
import { Text } from "@/ui/text";
import { formatMoneyMinor } from "@/utils/money";

import { dueDateLabel } from "./due-date-label";

interface SalaryRowProps {
  readonly amountMinor: number;
  readonly payday: string;
}

/** The usual salary, shown for information: it is not budget money until Got paid posts it. */
export function SalaryRow({ amountMinor, payday }: SalaryRowProps) {
  const amount = formatMoneyMinor(amountMinor, BUDGET_CURRENCY);
  return (
    <View
      accessible
      accessibilityLabel={`Expected salary ${amount} on ${dueDateLabel(payday)}. Not counted until you tap Got paid.`}
      style={styles.row}
    >
      <View style={styles.top}>
        <Text variant="body">Expected salary</Text>
        <Text variant="body">{amount}</Text>
      </View>
      <Text variant="caption">{dueDateLabel(payday)} · not counted until you tap Got paid</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.surfaceContainer,
    borderCurve: "continuous",
    borderRadius: radii.lg,
    gap: spacing[1],
    padding: spacing[4],
  },
  top: { flexDirection: "row", justifyContent: "space-between" },
});

import { StyleSheet, View } from "react-native";

import { Text } from "../text";
import { DENSE_MAX_FONT_SCALE, radius, space } from "../tokens";
import { FLOW_EXPENSE_COLOR, FLOW_INCOME_COLOR } from "./flow-series";

export interface FlowLegendProps {
  incomeLabel: string;
  expenseLabel: string;
}

const DOT = 10;

/** Colour key for the two series; the plot's summary carries the same information for screen readers. */
export function FlowLegend({ incomeLabel, expenseLabel }: FlowLegendProps) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.row}
    >
      <View style={styles.item}>
        <View style={[styles.dot, styles.income]} />
        <Text maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} variant="labelSm">
          {incomeLabel}
        </Text>
      </View>
      <View style={styles.item}>
        <View style={[styles.dot, styles.expense]} />
        <Text maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} variant="labelSm">
          {expenseLabel}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: space[4] },
  item: { alignItems: "center", flexDirection: "row", gap: 6 },
  dot: { borderRadius: radius.full, height: DOT, width: DOT },
  income: { backgroundColor: FLOW_INCOME_COLOR },
  expense: { backgroundColor: FLOW_EXPENSE_COLOR },
});

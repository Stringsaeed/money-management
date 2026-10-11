import { StyleSheet, Text as NativeText, View } from "react-native";

import { colors, DENSE_MAX_FONT_SCALE, fonts, radius } from "@/ui/trove";

interface HomeFlowLegendProps {
  /** e.g. `MAY → OCT`. */
  readonly span: string;
}

/** Series key under the plot, with the month span on the right. Hidden from screen readers. */
export function HomeFlowLegend({ span }: HomeFlowLegendProps) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.row}
    >
      <View style={styles.keys}>
        <View style={styles.key}>
          <View style={[styles.dot, styles.income]} />
          <NativeText maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={styles.keyLabel}>
            Income
          </NativeText>
        </View>
        <View style={styles.key}>
          <View style={[styles.dot, styles.spend]} />
          <NativeText maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={styles.keyLabel}>
            Spending
          </NativeText>
        </View>
      </View>
      <NativeText maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={styles.span}>
        {span}
      </NativeText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  keys: { flexDirection: "row", gap: 12 },
  key: { alignItems: "center", flexDirection: "row", gap: 5 },
  dot: { borderRadius: radius.full, height: 8, width: 8 },
  income: { backgroundColor: colors.positive.text },
  spend: { backgroundColor: colors.chartSpend },
  keyLabel: { color: colors.text.secondary, fontFamily: fonts.bold, fontSize: 12, lineHeight: 16 },
  span: { color: colors.text.tertiary, fontFamily: fonts.mono, fontSize: 10, lineHeight: 13 },
});

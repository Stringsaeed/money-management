import { StyleSheet, View } from "react-native";

import { Text } from "../text";
import { DENSE_MAX_FONT_SCALE, space } from "../tokens";
import { CategoryLegendRow } from "./category-legend-row";
import { CategorySegmentedBar } from "./category-segmented-bar";
import { ChartCard } from "./chart-card";
import { categorySummary, foldCategories, formatMoney, type CategoryAmount } from "./utils";

export interface CategoryBreakdownProps {
  categories: readonly CategoryAmount[];
  currency: string;
  title?: string;
  /** Categories beyond this many fold into Other (never more than six). */
  maxVisible?: number;
}

/** Where the money went: a segmented bar and a legend, six categories plus Other. */
export function CategoryBreakdown({
  categories,
  currency,
  title = "Where it went",
  maxVisible,
}: CategoryBreakdownProps) {
  const slices = foldCategories(categories, maxVisible);
  const total = slices.reduce((sum, slice) => sum + slice.minor, 0);
  const totalLabel = `${formatMoney(total, currency, false)} total`;

  return (
    <ChartCard>
      <View style={styles.header}>
        <Text accessibilityRole="header" variant="titleSm">
          {title}
        </Text>
        <Text maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} tone="secondary" variant="amountSm">
          {totalLabel}
        </Text>
      </View>
      <CategorySegmentedBar
        accessibilityLabel={`${title}, ${totalLabel}. ${categorySummary(slices, currency)}.`}
        slices={slices}
      />
      <View style={styles.legend}>
        {slices.map((slice) => (
          <CategoryLegendRow currency={currency} key={slice.id} slice={slice} />
        ))}
      </View>
    </ChartCard>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "baseline",
    flexDirection: "row",
    gap: space[3],
    justifyContent: "space-between",
  },
  legend: { gap: space[2] + space[0.5] },
});

import { StyleSheet, View } from "react-native";

import { Amount } from "../amount";
import { Text } from "../text";
import { categoryColors, DENSE_MAX_FONT_SCALE, space } from "../tokens";
import { formatMoney, formatShare, type CategorySlice } from "./utils";

export interface CategoryLegendRowProps {
  slice: CategorySlice;
  currency: string;
}

const SWATCH = 10;
const SWATCH_RADIUS = 3;
const SHARE_WIDTH = 52;

/** Swatch, name, amount and share. Labels and amounts stay in text tokens. */
export function CategoryLegendRow({ slice, currency }: CategoryLegendRowProps) {
  return (
    <View
      accessibilityLabel={`${slice.name}, ${formatMoney(slice.minor, currency)}, ${Math.round(slice.share * 100)} percent`}
      accessible
      style={styles.row}
    >
      <View style={[styles.swatch, { backgroundColor: categoryColors[slice.colorKey].color }]} />
      <Text
        maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
        numberOfLines={1}
        style={styles.name}
        variant="bodyMd"
      >
        {slice.name}
      </Text>
      <Amount currency={currency} minor={slice.minor} size="md" tone="primary" />
      <Text
        maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
        style={styles.share}
        tone="secondary"
        variant="amountSm"
      >
        {formatShare(slice.share)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: "center", flexDirection: "row", gap: space[2] + space[0.5], minHeight: 20 },
  swatch: { borderRadius: SWATCH_RADIUS, height: SWATCH, width: SWATCH },
  name: { flex: 1 },
  share: { textAlign: "right", width: SHARE_WIDTH },
});

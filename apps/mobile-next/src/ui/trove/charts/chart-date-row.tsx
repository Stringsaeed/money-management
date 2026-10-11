import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { Text } from "../text";
import { DENSE_MAX_FONT_SCALE } from "../tokens";
import { formatDay } from "./utils";

export interface ChartDateRowProps {
  /** ISO dates (`yyyy-MM-dd`) of the first and last point. */
  from: string;
  to: string;
  /** Absolute placement inside the chart (top, width). */
  style: StyleProp<ViewStyle>;
}

/** Start and end date labels under a chart. */
export function ChartDateRow({ from, to, style }: ChartDateRowProps) {
  return (
    <View style={[styles.row, style]}>
      <Text maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} tone="tertiary" variant="stamp">
        {formatDay(from)}
      </Text>
      <Text maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} tone="tertiary" variant="stamp">
        {formatDay(to)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", left: 0, position: "absolute" },
});

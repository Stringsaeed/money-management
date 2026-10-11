import { StyleSheet, View, type ColorValue } from "react-native";

import { colors, radius } from "../tokens";

export interface ColumnBarProps {
  height: number;
  width: number;
  left: number;
  /** Top offset of the baseline the bar stands on. */
  baselineY: number;
  /** The selected (or current) column takes the accent; the rest stay neutral. */
  highlighted: boolean;
  /** Overrides the highlight/past fill, e.g. the flow chart's income and spending series. */
  color?: ColorValue;
}

/** One column: 4pt rounded top, flat bottom on the baseline. */
export function ColumnBar({ height, width, left, baselineY, highlighted, color }: ColumnBarProps) {
  return (
    <View
      style={[
        styles.bar,
        highlighted ? styles.highlighted : styles.past,
        { height, left, top: baselineY - height, width },
        color === undefined ? null : { backgroundColor: color },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  bar: {
    borderTopLeftRadius: radius.xs,
    borderTopRightRadius: radius.xs,
    position: "absolute",
  },
  past: { backgroundColor: colors.chart.bar },
  highlighted: { backgroundColor: colors.accent.fill },
});

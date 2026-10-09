import { StyleSheet, View } from "react-native";

import { colors, radius } from "../tokens";

export interface ColumnBarProps {
  height: number;
  width: number;
  left: number;
  /** Top offset of the baseline the bar stands on. */
  baselineY: number;
  /** The selected (or current) column takes the accent; the rest stay neutral. */
  highlighted: boolean;
}

/** One column: 4pt rounded top, flat bottom on the baseline. */
export function ColumnBar({ height, width, left, baselineY, highlighted }: ColumnBarProps) {
  return (
    <View
      style={[
        styles.bar,
        highlighted ? styles.highlighted : styles.past,
        { height, left, top: baselineY - height, width },
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

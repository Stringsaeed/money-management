import { StyleSheet, View } from "react-native";

import { categoryColors, radius, space } from "../tokens";
import type { CategorySlice } from "./utils";

export interface CategorySegmentedBarProps {
  slices: readonly CategorySlice[];
  accessibilityLabel: string;
}

const BAR_HEIGHT = 12;
const MIN_SEGMENT = 4;

/** One segment per slice, sized by amount, split by a 2pt gap of the surface behind it. */
export function CategorySegmentedBar({ slices, accessibilityLabel }: CategorySegmentedBarProps) {
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="image"
      accessible
      style={styles.bar}
    >
      {slices.map((slice) => (
        <View
          key={slice.id}
          style={[
            styles.segment,
            { backgroundColor: categoryColors[slice.colorKey].color, flexGrow: slice.minor },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", gap: space[0.5], height: BAR_HEIGHT },
  segment: { borderRadius: radius.xs, flexBasis: 0, flexShrink: 1, minWidth: MIN_SEGMENT },
});

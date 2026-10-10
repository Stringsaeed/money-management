import { StyleSheet, View } from "react-native";

import { Icon, type IconName } from "../icon";
import { PressableScale } from "../pressable-scale";
import { colors, radius, space } from "../tokens";

export type FlowChartView = "bar" | "line";

export interface FlowViewToggleProps {
  value: FlowChartView;
  onChange: (view: FlowChartView) => void;
}

interface ToggleOption {
  value: FlowChartView;
  label: string;
  icon: IconName;
}

/** Line first, then bar, as on the board. */
const OPTIONS = [
  { value: "line", label: "Line chart", icon: "chart-line" },
  { value: "bar", label: "Bar chart", icon: "chart-bar" },
] as const satisfies readonly ToggleOption[];

const SEGMENT_WIDTH = 38;
const SEGMENT_HEIGHT = 32;
const TRACK_PADDING = 3;

/** Two-segment pill that swaps the chart between line and bar. Targets reach 44pt via hitSlop. */
export function FlowViewToggle({ value, onChange }: FlowViewToggleProps) {
  return (
    <View accessibilityLabel="Chart type" accessibilityRole="radiogroup" style={styles.track}>
      {OPTIONS.map((option) => {
        const selected = option.value === value;
        return (
          <PressableScale
            accessibilityLabel={option.label}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected, selected }}
            hitSlop={{ top: 6, bottom: 6, left: 3, right: 3 }}
            key={option.value}
            onPress={() => onChange(option.value)}
            scaleOnPress={false}
            style={[styles.segment, selected ? styles.selected : null]}
          >
            <Icon
              color={selected ? colors.text.primary : colors.text.secondary}
              name={option.icon}
              size={18}
            />
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: colors.fill.neutral,
    borderColor: colors.border.default,
    borderCurve: "continuous",
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: space[0.5],
    padding: TRACK_PADDING,
  },
  segment: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: radius.full,
    height: SEGMENT_HEIGHT,
    justifyContent: "center",
    width: SEGMENT_WIDTH,
  },
  selected: { backgroundColor: colors.fill.selected },
});

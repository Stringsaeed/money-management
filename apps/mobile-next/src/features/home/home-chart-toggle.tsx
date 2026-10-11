import { StyleSheet, View } from "react-native";

import { colors, Icon, type IconName, PressableScale, radius, space } from "@/ui/trove";

import type { HomeChartView } from "./home-chart-view";

interface HomeChartToggleProps {
  readonly value: HomeChartView;
  readonly onChange: (view: HomeChartView) => void;
}

const OPTIONS = [
  { value: "line", label: "Line chart", icon: "chart-line" },
  { value: "bar", label: "Bar chart", icon: "chart-bar" },
] as const satisfies readonly { value: HomeChartView; label: string; icon: IconName }[];

/** Compact two-segment pill on the Home card; segments reach 44pt through hitSlop. */
export function HomeChartToggle({ value, onChange }: HomeChartToggleProps) {
  return (
    <View accessibilityLabel="Chart type" accessibilityRole="radiogroup" style={styles.track}>
      {OPTIONS.map((option) => {
        const selected = option.value === value;
        return (
          <PressableScale
            accessibilityLabel={option.label}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected, selected }}
            hitSlop={{ bottom: 7, left: 4, right: 4, top: 7 }}
            key={option.value}
            onPress={() => onChange(option.value)}
            scaleOnPress={false}
            style={[styles.segment, selected ? styles.selected : null]}
          >
            <Icon
              color={selected ? colors.text.primary : colors.text.secondary}
              name={option.icon}
              size={17}
              strokeWidth={2}
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
    borderRadius: radius.full,
    borderWidth: 1,
    flexDirection: "row",
    gap: space[0.5],
    padding: 2,
  },
  segment: {
    alignItems: "center",
    borderRadius: radius.full,
    height: 30,
    justifyContent: "center",
    width: 36,
  },
  selected: { backgroundColor: colors.segmentOn },
});

import { useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";

import { Text } from "../text";
import { colors, DENSE_MAX_FONT_SCALE, fonts, radius, space } from "../tokens";
import { placeTooltip } from "./utils";

export interface ChartTooltipProps {
  /** `Today`, `Oct 3`. */
  label: string;
  /** Formatted amount, set in Plex Mono. */
  value: string;
  anchorX: number;
  /** Point the tooltip floats above; omit to pin it to the top edge. */
  anchorY?: number;
  containerWidth: number;
}

/** Inverted pill that follows the selected column or scrub position. */
export function ChartTooltip({
  label,
  value,
  anchorX,
  anchorY,
  containerWidth,
}: ChartTooltipProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width !== size.width || height !== size.height) setSize({ width, height });
  };
  const { left, top } = placeTooltip(anchorX, anchorY ?? null, size, containerWidth);

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      onLayout={handleLayout}
      pointerEvents="none"
      style={[styles.tooltip, { left, opacity: size.width > 0 ? 1 : 0, top }]}
    >
      <Text
        maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
        style={styles.label}
        variant="bodySm"
      >{`${label} · `}</Text>
      <Text maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={styles.value} variant="amountSm">
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tooltip: {
    alignItems: "baseline",
    backgroundColor: colors.chart.tooltipFill,
    borderCurve: "continuous",
    borderRadius: radius.sm,
    flexDirection: "row",
    paddingHorizontal: space[2],
    paddingVertical: space[1] + space[0.5],
    position: "absolute",
  },
  label: { color: colors.chart.tooltipText },
  value: { color: colors.chart.tooltipText, fontFamily: fonts.monoSemibold },
});

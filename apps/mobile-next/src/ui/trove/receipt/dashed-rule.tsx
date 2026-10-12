import { StyleSheet, View, type ColorValue } from "react-native";
import Svg, { Line } from "react-native-svg";

import { colors } from "../tokens";

export interface DashedRuleProps {
  /** Defaults to paper.ruleStrong, the rule printed between receipt sections. */
  color?: ColorValue;
  /** Stroke thickness in points (default 1.5). */
  thickness?: number;
  /**
   * `[dash, gap]` in points. Defaults to 4.5/4.5: Chrome draws a CSS `1.5px dashed` border with
   * dashes and gaps three times the thickness, which is what the boards show.
   */
  dash?: readonly [number, number];
}

const DEFAULT_DASH = [4.5, 4.5] as const;

/**
 * Full-width dashed rule. Drawn in SVG because one-sided dashed borders do not render on iOS;
 * the line runs to 100% so it needs no measuring. Decorative.
 */
export function DashedRule({
  color = colors.paper.ruleStrong,
  thickness = 1.5,
  dash = DEFAULT_DASH,
}: DashedRuleProps) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={[styles.rule, { height: thickness }]}
    >
      <Svg height={thickness} width="100%">
        <Line
          stroke={color}
          strokeDasharray={`${dash[0]} ${dash[1]}`}
          strokeWidth={thickness}
          x1={0}
          x2="100%"
          y1={thickness / 2}
          y2={thickness / 2}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  rule: { alignSelf: "stretch" },
});

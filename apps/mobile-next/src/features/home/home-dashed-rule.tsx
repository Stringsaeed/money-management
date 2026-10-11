import { useState } from "react";
import { View, type ColorValue, type LayoutChangeEvent } from "react-native";
import Svg, { Line } from "react-native-svg";

interface HomeDashedRuleProps {
  readonly color: ColorValue;
  readonly thickness: number;
  /** `[dash, gap]` in points. */
  readonly pattern: readonly [number, number];
}

/** Full-width dashed rule. Drawn in SVG: one-sided dashed borders do not render on iOS. */
export function HomeDashedRule({ color, thickness, pattern }: HomeDashedRuleProps) {
  const [width, setWidth] = useState(0);
  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      onLayout={onLayout}
      style={{ alignSelf: "stretch", height: thickness }}
    >
      {width > 0 ? (
        <Svg height={thickness} width={width}>
          <Line
            stroke={color}
            strokeDasharray={pattern.join(" ")}
            strokeWidth={thickness}
            x1={0}
            x2={width}
            y1={thickness / 2}
            y2={thickness / 2}
          />
        </Svg>
      ) : null}
    </View>
  );
}

import { useState } from "react";
import { StyleSheet, View, type ColorValue, type LayoutChangeEvent } from "react-native";
import Svg, { Line } from "react-native-svg";

interface LedgerDashedRuleProps {
  readonly color: ColorValue;
  /** `horizontal` spans its parent's width; `vertical` its height. */
  readonly orientation?: "horizontal" | "vertical";
}

/** The board's 1.5pt dashes: one-sided dashed borders do not render on iOS. */
const THICKNESS = 1.5;
const PATTERN = "4 3";

/** Receipt perforation: a 1.5pt dashed rule across or down its parent. Decorative. */
export function LedgerDashedRule({ color, orientation = "horizontal" }: LedgerDashedRuleProps) {
  const [length, setLength] = useState(0);
  const vertical = orientation === "vertical";
  const onLayout = ({ nativeEvent }: LayoutChangeEvent) =>
    setLength(vertical ? nativeEvent.layout.height : nativeEvent.layout.width);
  const middle = THICKNESS / 2;
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      onLayout={onLayout}
      style={vertical ? styles.vertical : styles.horizontal}
    >
      {length > 0 ? (
        <Svg height={vertical ? length : THICKNESS} width={vertical ? THICKNESS : length}>
          <Line
            stroke={color}
            strokeDasharray={PATTERN}
            strokeWidth={THICKNESS}
            x1={vertical ? middle : 0}
            x2={vertical ? middle : length}
            y1={vertical ? 0 : middle}
            y2={vertical ? length : middle}
          />
        </Svg>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  horizontal: { alignSelf: "stretch", height: THICKNESS },
  vertical: { alignSelf: "stretch", width: THICKNESS },
});

import { useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent, type ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";

import { colors } from "../tokens";
import { tearPath, type TearDepth } from "./tear-path";

export interface ReceiptTearProps {
  /** Tooth depth: 8 under compact slips and tickets, 10 (default) under full receipts. */
  depth?: TearDepth;
}

/**
 * The paper slip's torn bottom edge. Measured, so every tooth stays 10pt wide instead of
 * stretching with the slip. Decorative.
 */
export function ReceiptTear({ depth = 10 }: ReceiptTearProps) {
  const [width, setWidth] = useState(0);
  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      onLayout={onLayout}
      pointerEvents="none"
      style={[styles.tear, DEPTH_STYLE[depth]]}
    >
      {width > 0 ? (
        <Svg height={depth} width={width}>
          <Path d={tearPath(width, depth)} fill={colors.surface.paper} />
        </Svg>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // Overlaps the slip by a hairline so no seam shows at fractional widths.
  tear: { alignSelf: "stretch", marginTop: -0.5 },
  depth8: { height: 8 },
  depth10: { height: 10 },
});

const DEPTH_STYLE = { 8: styles.depth8, 10: styles.depth10 } as const satisfies Record<
  TearDepth,
  ViewStyle
>;

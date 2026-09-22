import { Defs, Pattern, Rect, Svg } from "react-native-svg";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { colors } from "../design-tokens";
import { tileColors } from "./tile-tokens";

const STRIPE_WIDTH = 26;
const PATTERN_WIDTH = 72;
const STRIPE_OPACITY = 0.14;

export function SoftStripedBackground() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, styles.container]}
      onLayout={({ nativeEvent: { layout } }) => {
        if (layout.width !== size.width || layout.height !== size.height) {
          setSize({ width: layout.width, height: layout.height });
        }
      }}
    >
      {size.width > 0 && size.height > 0 ? (
        <Svg height={size.height} width={size.width}>
          <Defs>
            <Pattern
              height={PATTERN_WIDTH}
              id="soft-striped-background"
              patternUnits="userSpaceOnUse"
              width={PATTERN_WIDTH}
            >
              <Rect
                fill={tileColors.stripe}
                height={PATTERN_WIDTH}
                opacity={STRIPE_OPACITY}
                width={STRIPE_WIDTH}
              />
            </Pattern>
          </Defs>
          <Rect fill="url(#soft-striped-background)" height={size.height} width={size.width} />
        </Svg>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
});

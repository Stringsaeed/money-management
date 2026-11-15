import { StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";

import { colors, PressableScale, radius } from "@/ui/trove";

/** Up and down arrows side by side; the Trove icon set has no swap glyph. */
const SWAP_PATH = "M8 4v16M4 16l4 4 4-4M16 20V4M12 8l4-4 4 4";

/** 36pt disc over the seam between FROM and TO that swaps them. */
export function SwapButton({ onPress }: { readonly onPress: () => void }) {
  return (
    <PressableScale
      accessibilityLabel="Swap from and to"
      accessibilityRole="button"
      hitSlop={4}
      onPress={onPress}
      pressedStyle={styles.pressed}
      style={styles.disc}
    >
      <Svg
        accessibilityElementsHidden
        fill="none"
        height={18}
        importantForAccessibility="no-hide-descendants"
        stroke={colors.text.primary}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        viewBox="0 0 24 24"
        width={18}
      >
        <Path d={SWAP_PATH} />
      </Svg>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  disc: {
    alignItems: "center",
    backgroundColor: colors.surface.raised,
    borderColor: colors.border.default,
    borderRadius: radius.full,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  pressed: { backgroundColor: colors.fill.neutral },
});

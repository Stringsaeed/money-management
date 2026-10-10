import type { ColorValue } from "react-native";
import { StyleSheet, View } from "react-native";

import { PressableScale } from "../pressable-scale";
import { layout, radius } from "../tokens";

export interface SwatchProps {
  name: string;
  hex: string;
  selected: boolean;
  gapColor: ColorValue;
  onPress: () => void;
}

const VISUAL = 32;
const GAP = 3;
const RING = 2;

/**
 * One round swatch: a 32pt disc in a 44pt target. Selected adds a gap in the surrounding
 * canvas colour, then a 2pt ring in the swatch colour.
 */
export function Swatch({ name, hex, selected, gapColor, onPress }: SwatchProps) {
  return (
    <PressableScale
      accessibilityLabel={name}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={styles.target}
    >
      <View
        style={[
          styles.ring,
          selected ? { backgroundColor: gapColor, borderColor: hex } : styles.ringIdle,
        ]}
      >
        <View style={[styles.disc, { backgroundColor: hex }]} />
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  target: {
    alignItems: "center",
    height: layout.minTouchTarget,
    justifyContent: "center",
    width: "100%",
  },
  ring: {
    alignItems: "center",
    borderRadius: radius.full,
    borderWidth: RING,
    height: VISUAL + 2 * (GAP + RING),
    justifyContent: "center",
    width: VISUAL + 2 * (GAP + RING),
  },
  ringIdle: { backgroundColor: "transparent", borderColor: "transparent" },
  disc: { borderRadius: radius.full, height: VISUAL, width: VISUAL },
});

import { StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { colors } from "../tokens";

const SIZE = 44;
const STROKE = 3;
const RADIUS = 19;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface KeypadHoldRingProps {
  /** 0 hides the ring; 1 is a full circle. */
  progress: number;
}

/** Ring that draws around the delete icon while it is held, track in keypad.ring, arc in accent.text. */
export function KeypadHoldRing({ progress }: KeypadHoldRingProps) {
  if (progress <= 0) return null;
  return (
    <Svg
      accessibilityElementsHidden
      height={SIZE}
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={styles.ring}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      width={SIZE}
    >
      <Circle
        cx={SIZE / 2}
        cy={SIZE / 2}
        fill="none"
        r={RADIUS}
        stroke={colors.keypad.ring}
        strokeWidth={STROKE}
      />
      <Circle
        cx={SIZE / 2}
        cy={SIZE / 2}
        fill="none"
        origin={`${SIZE / 2}, ${SIZE / 2}`}
        r={RADIUS}
        rotation={-90}
        stroke={colors.accent.text}
        strokeDasharray={`${CIRCUMFERENCE * progress} ${CIRCUMFERENCE}`}
        strokeLinecap="round"
        strokeWidth={STROKE}
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  ring: { position: "absolute" },
});

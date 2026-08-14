import { StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";

import { useGraphicPalette } from "@/components/graphics/palette";

/**
 * Two oversized colour glows drifting behind the flow. They never fully repeat
 * within a session, so the screen keeps breathing without ever calling
 * attention to itself.
 */
const DRIFT_SAGE = {
  "0%": { transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }] },
  "50%": { transform: [{ translateX: -26 }, { translateY: 34 }, { scale: 1.12 }] },
  "100%": { transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }] },
} as const;

const DRIFT_TERRACOTTA = {
  "0%": { transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1.08 }] },
  "50%": { transform: [{ translateX: 30 }, { translateY: -28 }, { scale: 1 }] },
  "100%": { transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1.08 }] },
} as const;

export function OnboardingBackground() {
  const { sage, terracotta } = useGraphicPalette();
  const { width } = useWindowDimensions();
  const reducedMotion = useReducedMotion();

  const sageSize = width * 1.45;
  const terracottaSize = width * 1.05;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          { position: "absolute", top: -sageSize * 0.45, right: -sageSize * 0.3 },
          reducedMotion
            ? null
            : {
                animationName: DRIFT_SAGE,
                animationDuration: "24s",
                animationIterationCount: "infinite",
                animationTimingFunction: "ease-in-out",
              },
        ]}
      >
        <Glow color={sage} id="onboarding-glow-sage" opacity={0.17} size={sageSize} />
      </Animated.View>

      <Animated.View
        style={[
          { position: "absolute", bottom: -terracottaSize * 0.34, left: -terracottaSize * 0.46 },
          reducedMotion
            ? null
            : {
                animationName: DRIFT_TERRACOTTA,
                animationDuration: "31s",
                animationIterationCount: "infinite",
                animationTimingFunction: "ease-in-out",
              },
        ]}
      >
        <Glow
          color={terracotta}
          id="onboarding-glow-terracotta"
          opacity={0.16}
          size={terracottaSize}
        />
      </Animated.View>
    </View>
  );
}

interface GlowProps {
  color: string;
  /** Gradient ids are document-scoped on native, so each glow needs its own. */
  id: string;
  opacity: number;
  size: number;
}

function Glow({ color, id, opacity, size }: GlowProps) {
  const radius = size / 2;

  return (
    <Svg width={size} height={size}>
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={color} stopOpacity={opacity} />
          <Stop offset="0.55" stopColor={color} stopOpacity={opacity * 0.35} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={radius} cy={radius} r={radius} fill={`url(#${id})`} />
    </Svg>
  );
}

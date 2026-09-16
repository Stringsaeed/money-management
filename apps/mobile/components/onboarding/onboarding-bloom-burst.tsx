import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

import { useGraphicPalette } from "@/components/graphics/palette";

const SPARK_COUNT = 10;
const BURST_DELAY_MS = 420;
const BURST_DURATION_MS = 1100;

interface OnboardingBloomBurstProps {
  /** Distance the furthest spark travels from the centre, in points. */
  radius?: number;
}

/**
 * A single outward scatter of seeds when the account is created. It plays once
 * and never repeats — a reward, not an ambient loop.
 */
export function OnboardingBloomBurst({ radius = 96 }: OnboardingBloomBurstProps) {
  const reducedMotion = useReducedMotion();
  const burst = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) return;

    burst.value = withDelay(
      BURST_DELAY_MS,
      withTiming(1, { duration: BURST_DURATION_MS, easing: Easing.out(Easing.cubic) }),
    );
  }, [burst, reducedMotion]);

  if (reducedMotion) return null;

  return (
    <View pointerEvents="none" style={styles.container}>
      {Array.from({ length: SPARK_COUNT }, (_, index) => (
        <Spark key={index} burst={burst} index={index} radius={radius} />
      ))}
    </View>
  );
}

interface SparkProps {
  burst: SharedValue<number>;
  index: number;
  radius: number;
}

function Spark({ burst, index, radius }: SparkProps) {
  const { sage, terracotta } = useGraphicPalette();

  // Alternating colour and a per-spark distance jitter keep the ring from
  // reading as a mechanical starburst.
  const color = index % 3 === 0 ? terracotta : sage;
  const angle = (index / SPARK_COUNT) * Math.PI * 2 - Math.PI / 2;
  const distance = radius * (0.72 + ((index * 37) % 100) / 320);

  const style = useAnimatedStyle(() => {
    const travelled = burst.value * distance;

    return {
      opacity: burst.value < 0.12 ? burst.value / 0.12 : 1 - (burst.value - 0.12) / 0.88,
      transform: [
        { translateX: Math.cos(angle) * travelled },
        { translateY: Math.sin(angle) * travelled },
        { scale: 1 - burst.value * 0.55 },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.spark,
        {
          width: index % 2 === 0 ? 7 : 5,
          height: index % 2 === 0 ? 7 : 5,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  spark: {
    position: "absolute",
    borderRadius: 4,
  },
});

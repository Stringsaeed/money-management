import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";

import { colors, spacing } from "@/lib/design-tokens";

interface OnboardingProgressProps {
  /** Zero-based index of the step currently on screen. */
  current: number;
  total: number;
}

/**
 * Segmented progress. Completed segments fill from the left; the active segment
 * also stretches, so the bar shows both how far along you are and where you are
 * without needing a "3 of 4" label.
 */
export function OnboardingProgress({ current, total }: OnboardingProgressProps) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: total, now: current + 1 }}
      style={styles.container}
    >
      {Array.from({ length: total }, (_, index) => {
        const isActive = index === current;

        return (
          <Animated.View
            key={index}
            style={[
              styles.segment,
              {
                flexGrow: isActive ? 2 : 1,
                transitionProperty: ["flexGrow"],
                transitionDuration: 420,
                transitionTimingFunction: "ease-out",
              },
            ]}
          >
            <Animated.View
              style={[
                styles.fill,
                {
                  opacity: isActive ? 1 : 0.5,
                  transform: [{ scaleX: index <= current ? 1 : 0 }],
                  transformOrigin: "left center",
                  transitionProperty: ["transform", "opacity"],
                  transitionDuration: [420, 260],
                  transitionTimingFunction: ["ease-out", "ease-out"],
                },
              ]}
            />
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: spacing[1.5],
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1.5],
  },
  segment: {
    height: spacing[1.5],
    overflow: "hidden",
    borderRadius: 9999,
    backgroundColor: colors.ink,
    opacity: 0.1,
  },
  fill: {
    height: "100%",
    width: "100%",
    borderRadius: 9999,
    backgroundColor: colors.ink,
  },
});

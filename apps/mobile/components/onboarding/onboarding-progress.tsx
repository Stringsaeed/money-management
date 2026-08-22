import { View } from "react-native";
import Animated from "react-native-reanimated";

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
      className="h-1.5 flex-row items-center gap-1.5"
    >
      {Array.from({ length: total }, (_, index) => {
        const isActive = index === current;

        return (
          <Animated.View
            key={index}
            style={{
              flexGrow: isActive ? 2 : 1,
              transitionProperty: ["flexGrow"],
              transitionDuration: 420,
              transitionTimingFunction: "ease-out",
            }}
            className="h-1.5 overflow-hidden rounded-full bg-ink/10"
          >
            <Animated.View
              className="h-full w-full rounded-full bg-ink"
              style={{
                opacity: isActive ? 1 : 0.5,
                transform: [{ scaleX: index <= current ? 1 : 0 }],
                transformOrigin: "left center",
                transitionProperty: ["transform", "opacity"],
                transitionDuration: [420, 260],
                transitionTimingFunction: ["ease-out", "ease-out"],
              }}
            />
          </Animated.View>
        );
      })}
    </View>
  );
}

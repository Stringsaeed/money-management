import type { ReactNode } from "react";
import { StyleSheet } from "react-native";
// oxlint-disable-next-line no-restricted-imports -- Height and opacity follow a scroll-driven shared value on the UI thread; Ease cannot bind styles to a shared value.
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";

interface CollapsibleRowProps {
  readonly hidden: SharedValue<number>;
  readonly children: ReactNode;
}

/**
 * Collapses its content to zero height as `hidden` goes 0 → 1.
 *
 * The content is laid out out-of-flow, so its measured height is always its natural height —
 * a child in flow would be squeezed by the collapsing parent and re-measure as 0, leaving the
 * row stuck shut.
 */
export function CollapsibleRow({ hidden, children }: CollapsibleRowProps) {
  const height = useSharedValue(0);
  const style = useAnimatedStyle(() => {
    const shown = 1 - hidden.value;
    return { height: height.value * shown, opacity: shown };
  });
  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -8 * hidden.value }],
  }));
  return (
    <Animated.View style={[styles.clip, style]}>
      <Animated.View
        style={[styles.content, contentStyle]}
        onLayout={(event) => {
          height.value = event.nativeEvent.layout.height;
        }}
      >
        {children}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: "hidden" },
  content: { left: 0, position: "absolute", right: 0, top: 0 },
});

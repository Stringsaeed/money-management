import { useEffect } from "react";
import { usePanGesture } from "react-native-gesture-handler";
import { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { TAB_WIDTH } from "./constants";

interface UseTabBarPanGestureParams {
  focusedIndex: number;
  tabCount: number;
  onSelect: (index: number) => void;
}

export const useTabBarPanGesture = ({
  focusedIndex,
  tabCount,
  onSelect,
}: UseTabBarPanGestureParams) => {
  const maxOffset = Math.max(0, (tabCount - 1) * TAB_WIDTH);

  const offset = useSharedValue(focusedIndex * TAB_WIDTH);
  const startOffset = useSharedValue(0);
  const isDragging = useSharedValue(false);

  useEffect(() => {
    if (isDragging.value) return;

    offset.value = withTiming(focusedIndex * TAB_WIDTH, {
      duration: 280,
      easing: Easing.out(Easing.cubic),
    });
  }, [focusedIndex, offset, isDragging]);

  const panGesture = usePanGesture({
    activeOffsetX: [-8, 8],
    onActivate: () => {
      startOffset.value = offset.value;
      isDragging.value = true;
    },
    onUpdate: (event) => {
      const next = startOffset.value + event.translationX;
      offset.value = Math.min(Math.max(next, 0), maxOffset);
    },
    onDeactivate: () => {
      const index = Math.min(Math.max(Math.round(offset.value / TAB_WIDTH), 0), tabCount - 1);
      offset.value = withTiming(index * TAB_WIDTH, {
        duration: 220,
        easing: Easing.out(Easing.cubic),
      });
      scheduleOnRN(onSelect, index);
    },
    onFinalize: () => {
      isDragging.value = false;
    },
  });

  const capsuleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  return { panGesture, capsuleStyle };
};
